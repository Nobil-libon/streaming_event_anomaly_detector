# producer.py

import time
import random
from datetime import datetime
from queue import Queue

event_queue = Queue()


def generate_event(order_id):
    return {
        "event": "order_placed",
        "order_id": f"ORD{order_id}",
        "timestamp": time.time()
    }


def producer():

    order_id = 1

    print("🚀 Producer Started...")

    while True:

        # Normal traffic
        events_this_second = random.randint(1, 3)

        # Simulated anomaly
        if random.random() < 0.05:
            events_this_second = random.randint(15, 30)

        for _ in range(events_this_second):

            event = generate_event(order_id)

            event_queue.put(event)

            print(f"Generated: {event}")

            order_id += 1

        time.sleep(1)


if __name__ == "__main__":
    producer()