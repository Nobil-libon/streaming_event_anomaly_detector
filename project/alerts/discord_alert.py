# alerts/discord_alert.py
# Send real-time SRE alerts to Discord webhook when high/critical severity anomalies are flagged.

import requests
from config import DISCORD_WEBHOOK_URL

def send_discord_alert(opm: int, z_score: float, severity: str, recommendation: str) -> None:
    """Send alert data to Discord webhook if DISCORD_WEBHOOK_URL is configured."""
    if not DISCORD_WEBHOOK_URL:
        print("[Alert] Discord webhook URL not configured. Skipping alert.")
        return
        
    # Standard color mapping for Discord embeds
    color_map = {
        "CRITICAL": 15158332, # Red
        "HIGH": 15105570,     # Orange
        "MEDIUM": 16768000,   # Yellow
        "LOW": 3066993        # Green
    }
    color = color_map.get(severity.upper(), 3447003) # Blue default
    
    payload = {
        "embeds": [
            {
                "title": f"🚨 SRE Agent Alert: {severity.upper()} Anomaly Flagged",
                "color": color,
                "fields": [
                    {"name": "Orders Per Minute (OPM)", "value": str(opm), "inline": True},
                    {"name": "Z-Score", "value": f"{z_score:.2f}", "inline": True},
                    {"name": "Action Recommendation", "value": recommendation, "inline": False}
                ],
                "description": "AI Agent Loop analyzed system behavior and flagged anomalous metrics requiring attention."
            }
        ]
    }
    
    try:
        response = requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=5)
        if response.status_code in (200, 204):
            print(f"[Alert] Discord webhook alert sent ({severity})")
        else:
            print(f"[Alert] Discord webhook returned status code {response.status_code}: {response.text}")
    except Exception as exc:
        print(f"[Alert] Failed to send Discord webhook alert: {exc}")
