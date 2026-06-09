# producer.py

import time
import random
from datetime import datetime
from queue import Queue
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from config import EVENT_INTERVAL

# Shared Queue
event_queue = Queue()


def generate_event(order_id, orders_per_minute, traffic_type):
    """
    Generate a streaming event
    """
    return {
        "event": "order_placed",
        "order_id": f"ORD{order_id}",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "orders_per_minute": orders_per_minute,
        "traffic_type": traffic_type,
        "source": random.choice(["web", "mobile", "api"])
    }


def producer():

    order_id = 1
    current_orders = 50

    print("🚀 Producer Started...")

    while True:

        scenario = random.random()

        # Recovery after large spikes
        if current_orders > 100:
            current_orders -= random.randint(10, 30)

        # Normal Traffic (80%)
        if scenario < 0.80:
            current_orders += random.randint(-5, 5)
            traffic_type = "normal"

        # Traffic Spike (10%)
        elif scenario < 0.90:
            current_orders += random.randint(60, 120)
            traffic_type = "spike"

        # Traffic Drop (5%)
        elif scenario < 0.95:
            current_orders -= random.randint(20, 40)
            traffic_type = "drop"

        # Extreme Spike (5%)
        else:
            current_orders += random.randint(200, 400)
            traffic_type = "extreme_spike"

        # Prevent negative values
        current_orders = max(0, current_orders)

        # Prevent unrealistic growth
        current_orders = min(current_orders, 1000)

        event = generate_event(
            order_id=order_id,
            orders_per_minute=current_orders,
            traffic_type=traffic_type
        )

        event_queue.put(event)

        print(f"[{traffic_type.upper()}] {event}")
        print(f"Queue Size: {event_queue.qsize()}")

        order_id += 1

        time.sleep(EVENT_INTERVAL)


if __name__ == "__main__":
    producer()