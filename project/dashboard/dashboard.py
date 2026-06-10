# dashboard.py

import streamlit as st
import pandas as pd
import random
from datetime import datetime

st.set_page_config(
    page_title="Streaming Event Anomaly Detector",
    layout="wide"
)

st.title("📊 Streaming Event Anomaly Detector")

# Metrics

col1, col2, col3 = st.columns(3)

col1.metric(
    "Orders Per Minute",
    random.randint(40, 60)
)

col2.metric(
    "Z-Score",
    round(random.uniform(-1, 4), 2)
)

col3.metric(
    "Status",
    "Normal"
)

# Sample Chart

st.subheader("Live Orders Trend")

data = pd.DataFrame({
    "Orders": [45, 48, 50, 47, 52, 49, 55, 53]
})

st.line_chart(data)

# Recent Events

st.subheader("Recent Events")

events = pd.DataFrame([
    {
        "Order ID": "ORD101",
        "Timestamp": datetime.now(),
        "Type": "Normal"
    },
    {
        "Order ID": "ORD102",
        "Timestamp": datetime.now(),
        "Type": "Spike"
    }
])

st.dataframe(events)

# LLM Output

st.subheader("🤖 Llama 3.1 Analysis")

st.info(
    "No anomaly detected yet."
)