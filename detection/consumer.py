# consumer.py

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import time
import numpy as np
from collections import deque

from stream.producer import event_queue
from ai.llm_check import explain_anomaly

WINDOW_SIZE = 20
Z_SCORE_THRESHOLD = 3.0


def calculate_z_score(value, window):

    mean = np.mean(window)
    std = np.std(window)

    if std == 0:
        return 0

    return (value - mean) / std


def consumer():

    print("📊 Consumer Started...")

    sliding_window = deque(maxlen=WINDOW_SIZE)

    while True:

        if not event_queue.empty():

            event = event_queue.get()

            orders = event["orders_per_minute"]

            sliding_window.append(orders)

            if len(sliding_window) < WINDOW_SIZE:

                print(
                    f"Collecting baseline data... "
                    f"({len(sliding_window)}/{WINDOW_SIZE})"
                )

                continue

            z_score = calculate_z_score(
                orders,
                list(sliding_window)
            )

            print(
                f"Orders: {orders} | "
                f"Mean: {np.mean(sliding_window):.2f} | "
                f"Z-Score: {z_score:.2f}"
            )

            if abs(z_score) > Z_SCORE_THRESHOLD:

                print("\n🚨 ANOMALY DETECTED 🚨")

                print(f"Orders Per Minute : {orders}")
                print(f"Z-Score           : {z_score:.2f}")
                print(f"Traffic Type      : {event['traffic_type']}")
                print(f"Source            : {event['source']}")
                print(f"Timestamp         : {event['timestamp']}")

                print("\n🤖 Llama 3.1 Analysis:")

                try:

                    explanation = explain_anomaly(
                        metric_name="orders_per_minute",
                        value=orders,
                        z_score=round(z_score, 2)
                    )

                    print(explanation)

                except Exception as e:

                    print(f"LLM Error: {e}")

                print("-" * 60)

        time.sleep(0.5)


if __name__ == "__main__":
    consumer()