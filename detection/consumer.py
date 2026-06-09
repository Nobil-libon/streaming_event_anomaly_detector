# consumer.py

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import time
import numpy as np
from collections import deque

from stream.producer import event_queue
from ai.llm_check import explain_anomaly

WINDOW_SIZE = 30
Z_SCORE_THRESHOLD = 3.0

order_timestamps = []
opm_history = deque(maxlen=WINDOW_SIZE)


def calculate_z_score(value, window):

    mean = np.mean(window)
    std = np.std(window)

    if std == 0:
        return 0

    return (value - mean) / std


def consumer():

    print("📊 Consumer Started...")

    while True:

        while not event_queue.empty():

            event = event_queue.get()

            order_timestamps.append(event["timestamp"])

        current_time = time.time()

        # Demo Mode:
        # 1 second = 1 simulated minute

        order_timestamps[:] = [
            ts for ts in order_timestamps
            if current_time - ts <= 60
        ]

        orders_per_minute = len(order_timestamps)

        opm_history.append(orders_per_minute)

        if len(opm_history) < WINDOW_SIZE:

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

        print(
            f"OPM={orders_per_minute} | "
            f"Z-Score={z_score:.2f}"
        )

        if abs(z_score) > Z_SCORE_THRESHOLD:

            print("\n🚨 ANOMALY DETECTED 🚨")

            print(
                f"Orders Per Minute: {orders_per_minute}"
            )

            print(
                f"Z-Score: {z_score:.2f}"
            )

            try:

                explanation = explain_anomaly(
                    "orders_per_minute",
                    orders_per_minute,
                    round(z_score, 2)
                )

                print("\n🤖 Llama Analysis:")
                print(explanation)

            except Exception as e:

                print(f"LLM Error: {e}")

            print("-" * 60)

        time.sleep(1)


if __name__ == "__main__":
    consumer()