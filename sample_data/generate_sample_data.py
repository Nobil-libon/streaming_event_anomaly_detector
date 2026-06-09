import json
import random
from datetime import datetime, timedelta

events = []

start_time = datetime.now()

for i in range(100):

    orders = random.randint(45, 60)

    if random.random() < 0.1:
        orders = random.randint(200, 500)

    events.append({
        "event": "order_placed",
        "timestamp": (start_time + timedelta(seconds=i)).strftime("%Y-%m-%d %H:%M:%S"),
        "order_id": f"ORD{i+1:03}",
        "orders_per_minute": orders
    })

with open("sample_events.json", "w") as f:
    json.dump(events, f, indent=4)

print("sample_events.json generated successfully!")