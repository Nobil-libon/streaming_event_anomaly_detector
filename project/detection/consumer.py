# consumer.py

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import time
import numpy as np
from collections import deque
from datetime import datetime

from stream.producer import event_queue
from ai.llm_check import explain_anomaly
from storage.db import save_anomaly, save_agent_decision
from ai.agent import analyze_anomaly_agent
from alerts.discord_alert import send_discord_alert

WINDOW_SIZE = 30
Z_SCORE_THRESHOLD = 3.0

order_timestamps = []
opm_history = deque(maxlen=WINDOW_SIZE)

# ---------------------------------------------------------------------------
# Shared state — read by api/server.py to serve the dashboard
# ---------------------------------------------------------------------------
shared_state = {
    "opm": 0,
    "z_score": 0.0,
    "is_anomaly": False,
    "total_events": 0,
    "anomaly_count": 0,
    "queue_size": 0,
    "threshold": Z_SCORE_THRESHOLD,
    "model_name": "llama3.1",
    "opm_history": [],
    "recent_events": [],
    "ai_explanation": "",
    "status": "collecting_baseline",
    "latest_agent_decision": None,
}
# ---------------------------------------------------------------------------


def calculate_z_score(value, window):

    mean = np.mean(window)
    std = np.std(window)

    if std == 0:
        return 0

    return (value - mean) / std


def consumer():

    print("📊 Consumer Started...")

    total_events = 0
    anomaly_count = 0
    recent_events = deque(maxlen=20)

    while True:

        processed_this_tick = 0
        while not event_queue.empty():

            event = event_queue.get()
            order_timestamps.append(event["timestamp"])
            total_events += 1
            processed_this_tick += 1

            recent_events.appendleft({
                "order_id": event["order_id"],
                "timestamp": datetime.fromtimestamp(
                    event["timestamp"]
                ).strftime("%H:%M:%S.%f")[:-3],
                "type": "Normal",
                "opm": shared_state["opm"],
            })

        current_time = time.time()

        # Demo Mode:
        # 1 second = 1 simulated minute

        order_timestamps[:] = [
            ts for ts in order_timestamps
            if current_time - ts <= 60
        ]

        orders_per_minute = len(order_timestamps)

        opm_history.append(orders_per_minute)

        # Update shared state — baseline collecting phase
        shared_state["opm"] = int(orders_per_minute)
        shared_state["total_events"] = int(total_events)
        shared_state["queue_size"] = int(event_queue.qsize())
        
        # Update the newly processed events with the correct OPM
        for i in range(min(processed_this_tick, len(recent_events))):
            recent_events[i]["opm"] = int(orders_per_minute)
            
        shared_state["opm_history"] = [int(v) for v in opm_history]
        shared_state["recent_events"] = list(recent_events)

        if len(opm_history) < WINDOW_SIZE:

            shared_state["status"] = "collecting_baseline"

            print(
                f"Collecting baseline... "
                f"({len(opm_history)}/{WINDOW_SIZE}) "
                f"OPM={orders_per_minute}"
            )

            time.sleep(1)
            continue

        z_score = calculate_z_score(
            orders_per_minute,
            list(opm_history)
        )

        is_anomaly = bool(abs(z_score) > Z_SCORE_THRESHOLD)

        # Update shared state — running phase
        shared_state["z_score"] = float(round(z_score, 2))
        shared_state["is_anomaly"] = is_anomaly
        shared_state["status"] = "anomaly" if is_anomaly else "normal"

        print(
            f"OPM={orders_per_minute} | "
            f"Z-Score={z_score:.2f}"
        )

        if is_anomaly:

            anomaly_count += 1
            shared_state["anomaly_count"] = anomaly_count

            # Mark all events processed during this anomaly window as Anomaly
            for i in range(min(processed_this_tick, len(recent_events))):
                recent_events[i]["type"] = "Anomaly"

            print("\n🚨 ANOMALY DETECTED 🚨")
            print(f"Orders Per Minute: {orders_per_minute}")
            print(f"Z-Score: {z_score:.2f}")

            try:

                explanation = explain_anomaly(
                    "orders_per_minute",
                    orders_per_minute,
                    round(z_score, 2)
                )

                shared_state["ai_explanation"] = explanation

                print("\n🤖 Llama Analysis:")
                print(explanation)

            except Exception as e:

                explanation = f"LLM Error: {e}"
                shared_state["ai_explanation"] = explanation
                print(f"LLM Error: {e}")

            # Persist anomaly to SQLite (includes LLM explanation)
            save_anomaly(current_time, orders_per_minute, round(z_score, 2), shared_state["ai_explanation"])

            # ----------------------------------------------------------------
            # Run SRE Agent reasoning loop, persist decision, and trigger alerts
            # ----------------------------------------------------------------
            try:
                print("\n🧠 Invoking AI SRE Agent Loop...")
                decision = analyze_anomaly_agent(
                    orders_per_minute,
                    round(z_score, 2),
                    shared_state["ai_explanation"]
                )
                shared_state["latest_agent_decision"] = decision
                
                print(f"🤖 Agent Analysis Summary:")
                print(f"  - Severity: {decision['severity']}")
                print(f"  - Cause: {decision['possible_cause']}")
                print(f"  - Action: {decision['recommendation']}")
                print(f"  - Alert Required: {decision['requires_alert']}")
                
                save_agent_decision(
                    current_time,
                    orders_per_minute,
                    round(z_score, 2),
                    decision["severity"],
                    decision["possible_cause"],
                    decision["recommendation"],
                    decision["requires_alert"]
                )
                
                if decision["requires_alert"]:
                    send_discord_alert(
                        orders_per_minute,
                        round(z_score, 2),
                        decision["severity"],
                        decision["recommendation"]
                    )
            except Exception as agent_err:
                print(f"[Consumer] Agent error: {agent_err}")

            print("-" * 60)

        time.sleep(1)


if __name__ == "__main__":
    consumer()