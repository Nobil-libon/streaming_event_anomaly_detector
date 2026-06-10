# ai/agent.py
# AI Agent reasoning loop for anomaly severity assessment, root cause analysis,
# action recommendation, and alert triage.

import json
from ollama import chat

def analyze_anomaly_agent(orders_per_minute: int, z_score: float, llama_explanation: str) -> dict:
    """
    Executes a reasoning loop using Llama 3.1 to analyze an anomaly.
    Determines severity, possible root cause, recommendation, and alert necessity.
    """
    abs_z = abs(z_score)
    
    # -----------------------------------------------------------------------
    # Determine base severity guideline programmatically to assist the model
    # -----------------------------------------------------------------------
    if abs_z < 3.0:
        suggested_severity = "LOW"
    elif 3.0 <= abs_z < 5.0:
        suggested_severity = "MEDIUM"
    elif 5.0 <= abs_z < 8.0:
        suggested_severity = "HIGH"
    else:
        suggested_severity = "CRITICAL"

    prompt = f"""
    You are an AI Site Reliability Engineering (SRE) Agent. Analyze the following anomaly data:
    
    - Metric: orders_per_minute
    - Value (Current OPM): {orders_per_minute}
    - Z-Score: {z_score:.2f}
    - Raw Explanation: {llama_explanation}
    
    Rule Guidelines:
    - If Z-Score magnitude < 3: Severity is LOW (requires_alert is false)
    - If Z-Score magnitude is between 3 and 5: Severity is MEDIUM (requires_alert is false)
    - If Z-Score magnitude is between 5 and 8: Severity is HIGH (requires_alert is true)
    - If Z-Score magnitude > 8: Severity is CRITICAL (requires_alert is true)
    
    Based on the raw explanation, determine the most likely specific possible cause and give a actionable SRE recommendation.
    
    You MUST respond in raw JSON format matching this schema exactly:
    {{
        "severity": "LOW | MEDIUM | HIGH | CRITICAL",
        "recommendation": "Your actionable recommendation here",
        "possible_cause": "Likely root cause description here",
        "requires_alert": true or false
    }}
    """

    try:
        response = chat(
            model="llama3.1",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            format="json"
        )
        content = response["message"]["content"]
        decision = json.loads(content)
        
        # Validate required fields
        required_keys = ["severity", "recommendation", "possible_cause", "requires_alert"]
        if all(k in decision for k in required_keys):
            return {
                "severity": str(decision["severity"]).upper(),
                "recommendation": str(decision["recommendation"]),
                "possible_cause": str(decision["possible_cause"]),
                "requires_alert": bool(decision["requires_alert"])
            }
    except Exception as exc:
        print(f"[Agent] LLM parsing failed or model unavailable ({exc}). Using programmatic fallback.")

    # -----------------------------------------------------------------------
    # SRE Fallback Logic (if model fails or is offline)
    # -----------------------------------------------------------------------
    requires_alert = suggested_severity in ("HIGH", "CRITICAL")
    
    if suggested_severity == "LOW":
        recommendation = "Monitor rate. No immediate action required."
        possible_cause = "Minor traffic fluctuation or baseline variance."
    elif suggested_severity == "MEDIUM":
        recommendation = "Keep an eye on system health dashboard. Check server resource usage if trend persists."
        possible_cause = "Moderate change in ordering rate. Potential minor promotional activity."
    elif suggested_severity == "HIGH":
        recommendation = "Investigate immediately. Check database latency, API error rates, and load balancers."
        possible_cause = llama_explanation or "Significant spike in transaction volume."
    else: # CRITICAL
        recommendation = "PAGERDUTY ALERT. Escalate to on-call engineer. Engage rate limiting or spin up extra instances."
        possible_cause = llama_explanation or "Critical transaction volume spike (potential DDoS or system glitch)."

    return {
        "severity": suggested_severity,
        "recommendation": recommendation,
        "possible_cause": possible_cause,
        "requires_alert": requires_alert
    }

if __name__ == "__main__":
    # Smoke test
    result = analyze_anomaly_agent(320, 5.8, "Sudden flash sale triggered bulk ordering.")
    print("Agent Result:")
    print(json.dumps(result, indent=2))
