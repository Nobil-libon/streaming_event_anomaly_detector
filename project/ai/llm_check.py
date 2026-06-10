from ollama import chat

def explain_anomaly(metric_name, value, z_score):
    
    prompt = f"""
    Metric: {metric_name}
    Value: {value}
    Z-Score: {z_score}

    Explain in 2-3 lines why this event is abnormal.
    Mention possible causes.
    """

    response = chat(
        model="llama3.1",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response["message"]["content"]

if __name__ == "__main__":

    result = explain_anomaly(
        "orders_per_minute",
        450,
        7.2
    )

    print(result)