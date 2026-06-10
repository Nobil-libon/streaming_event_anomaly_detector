# 🚨 Streaming Event Anomaly Detector with AI Agent Loop

> AI Prototype Challenge 2026 — Infinite  
> Real-time order event stream monitoring with Z-Score detection, Gemini AI analysis, and autonomous agent-driven alerting.

---

## 👥 Team Information

| Field | Details |
|-------|---------|
| Team Name | `[Nexus Four]` |
| Member 1 | `[Rabin Kumar J]` |
| Member 2 | `[Nobil S]` |
| Member 3 | `[Shriraam K C]` |
| Member 4 | `[Muhilan K]` |
| College | `[J J College of Engineering and Technology]` |
| GitHub | `[https://github.com/Nobil-libon/streaming_event_anomaly_detector]` |

---

## 📌 Problem Statement

Modern e-commerce and financial platforms generate thousands of order events per minute. Sudden anomalies — traffic spikes, order volume drops, or unusual patterns — can indicate system failures, fraud, or infrastructure issues. Manual monitoring is too slow to catch these in real time.

This project builds a fully automated streaming pipeline that detects anomalies, explains them using a local LLM, and autonomously decides whether to raise alerts — all without human intervention.

---

## 💡 Solution Overview

A real-time event streaming system that:

1. **Generates** simulated order events via a producer
2. **Consumes** and monitors events using Z-Score statistical detection
3. **Analyzes** anomalies using Gemini API (Google AI)
4. **Decides** autonomously using an AI Agent Loop (severity classification + recommendation)
5. **Alerts** via Discord webhook when anomalies cross thresholds
6. **Visualizes** everything on a live React dashboard with FastAPI backend

---

## 🏗️ Architecture

```
Producer (stream/producer.py)
        │
        ▼
   SQLite Database (storage/events.db)
        │
        ▼
Consumer + Z-Score Detection (detection/consumer.py)
        │
        ▼
   Gemini API (ai/llm_check.py)
        │
        ▼
     AI Agent Loop
   ┌───┴────────────┐
   │                │
   ▼                ▼
Discord Alert    FastAPI APIs
(alerts/)        (main.py)
                    │
                    ▼
           React Dashboard
           (dashboard/)
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js |
| Backend | FastAPI (Python) |
| Database | SQLite |
| AI Model | Gemini API (Google AI) |
| Detection | Z-Score Statistical Analysis |
| Authentication | JWT (JSON Web Tokens) |
| Authorization | RBAC (Role-Based Access Control) |
| Alerts | Discord Webhook |
| Containerization | Docker + Docker Compose |
| Testing | Pytest |

---

## 📁 Project Structure

```
streaming_event_anomaly_detector/
│
├── project/
│   ├── config.py               # Centralized configuration
│   ├── main.py                 # FastAPI app entry point
│   ├── requirements.txt        # Python dependencies
│   ├── README.md
│   ├── ai_usage_note.md        # AI tool usage disclosure
│   ├── .env                    # Environment variables
│   │
│   ├── stream/
│   │   └── producer.py         # Event generator (orders per minute)
│   │
│   ├── detection/
│   │   └── consumer.py         # Z-Score anomaly consumer
│   │
│   ├── ai/
│   │   └── llm_check.py        # Llama 3.1 analysis via Ollama
│   │
│   ├── alerts/
│   │   └── discord_alert.py    # Discord webhook integration
│   │
│   ├── dashboard/
│   │   └── dashboard.py        # React dashboard (FastAPI served)
│   │
│   ├── storage/
│   │   └── events.db           # SQLite database
│   │
│   ├── logs/
│   │   └── anomalies.log       # Anomaly log file
│   │
│   ├── sample_data/
│   │   └── sample_events.json  # Sample event data for testing
│   │
│   └── test_cases/
│       └── test_anomaly.py     # Pytest test suite
│
├── .git/
└── .gitignore
```

---

## ✨ Features

- **Live Event Stream** — Simulated order events with configurable rate
- **Z-Score Detection** — Statistically flags orders-per-minute anomalies
- **Llama 3.1 AI Analysis** — Local LLM generates root cause explanations via Ollama
- **AI Agent Loop** — Autonomous severity classification (LOW / MEDIUM / HIGH) and recommendations
- **JWT Authentication** — Secure login with token-based sessions
- **RBAC Authorization** — Admin, Analyst, and Viewer roles with scoped access
- **React Dashboard** — Live metrics, recent events table, anomaly feed, agent decisions panel
- **Discord Alerts** — Real-time webhook notifications on HIGH severity anomalies
- **SQLite Storage** — Lightweight persistent storage for events, anomalies, and agent decisions
- **Docker Support** — Single-command deployment

---

## 🤖 AI Capability Demonstration

**Selected Capability: AI Agent Loop**

When a Z-Score anomaly is detected, the system triggers an autonomous agent workflow:

```
Anomaly Detected (Z-Score > threshold)
        │
        ▼
  LLM Analysis (Ollama Llama 3.1)
  "Explain possible causes of this OPM spike"
        │
        ▼
  Agent Decision Engine
  ┌─────────────────────────────────┐
  │ Severity:     HIGH              │
  │ Possible Cause: Traffic Spike   │
  │ Recommendation: Monitor APIs    │
  │ Alert Sent:   YES               │
  └─────────────────────────────────┘
        │
        ▼
  Discord Alert + Dashboard Update
```

The agent does not require human intervention — it classifies, recommends, and acts autonomously.

---

## 🔐 Authentication & Authorization

### Authentication
- Users log in via `POST /login`
- JWT token issued on success
- Token required in `Authorization: Bearer <token>` header for all protected routes

### Authorization — RBAC Roles

| Role | Permissions |
|------|------------|
| Admin | Full access — manage users, view all data, configure thresholds |
| Analyst | View events, anomalies, agent decisions, trigger manual analysis |
| Viewer | Read-only access to dashboard and metrics |

---

## 🗄️ Database Design

### Tables

**users**
```
id | username | password_hash | role | created_at
```

**events**
```
id | order_id | timestamp | opm | raw_value
```

**anomalies**
```
id | event_id | z_score | detected_at | status
```

**agent_decisions**
```
id | anomaly_id | severity | cause | recommendation | alert_sent | decided_at
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| POST | `/login` | Authenticate and receive JWT | ❌ |
| GET | `/events` | Fetch recent events | ✅ |
| GET | `/metrics` | Live OPM metrics | ✅ |
| GET | `/anomalies` | List detected anomalies | ✅ |
| GET | `/agent/decisions` | AI agent decision log | ✅ |
| POST | `/producer/start` | Start event producer | ✅ Admin |
| POST | `/producer/stop` | Stop event producer | ✅ Admin |

---

## ⚙️ Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- Ollama with `llama3.1` model installed locally
- Docker & Docker Compose (optional)

### 1. Clone the Repository

```bash
git clone [YOUR_REPO_URL]
cd streaming_event_anomaly_detector
```

### 2. Set Up Python Environment

```bash
# Set up venv in the root or inside project
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# Navigate into project/ directory to install dependencies
cd project
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside `project/`:

```env
SECRET_KEY=your_jwt_secret_key
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
Z_SCORE_THRESHOLD=2.5
EVENT_INTERVAL=1
DATABASE_URL=storage/events.db
```

### 4. Install React Dashboard Dependencies

```bash
cd frontend
npm install
npm run build
cd ..
```

---

## 🚀 Run Instructions

### Option A — Manual

Run all commands from within the `project/` directory:

```bash
cd project

# Terminal 1: Start FastAPI backend
python -m uvicorn api.server:app --host 127.0.0.1 --port 8000

# Terminal 2: Start React frontend dev server
cd frontend
npm run dev
```

Visit: `http://localhost:5173` (with proxy configured to backend port 8000)

### Option B — Docker Compose

```bash
cd project
docker compose up --build
```

Visit: `http://localhost:8000`

> ⚠️ Ensure your local Ollama server is running with `llama3.1` before starting.

---

## 🧪 Test Cases

```bash
pytest test_cases/ -v
```

| Test | Description | Expected |
|------|------------|---------|
| `test_login` | Valid user login | JWT token returned |
| `test_event_generation` | Producer creates events | Events in DB |
| `test_anomaly_detection` | Z-Score flags spike | Anomaly recorded |
| `test_agent_decision` | Agent classifies anomaly | Severity + recommendation |
| `test_discord_alert` | Alert on HIGH severity | Webhook called |

---

## 📸 Screenshots

> *(Add screenshots to `/screenshots` folder and link here)*

- Login Page
- Dashboard — Live Metrics
- Recent Events Table
- Anomaly Detection Feed
- AI Agent Decision Panel
- Discord Alert Message

---

## ⚠️ Assumptions

- Events are simulated (not from a live production system)
- SQLite is used for lightweight, single-node storage
- Gemini API is used for AI analysis (requires valid API key)
- Discord webhook URL is configured in `.env`
- Z-Score threshold is configurable via environment variable

---

## 🚧 Limitations

- Single-node deployment only (no horizontal scaling)
- No Kafka or message queue integration
- Synthetic/simulated event data
- Gemini API requires internet connectivity and valid API key
- SQLite not suitable for high-concurrency production workloads

---

## 🔮 Future Enhancements

- Apache Kafka for true distributed streaming
- PostgreSQL for production-grade storage
- Cloud deployment (AWS / GCP / Azure)
- Multi-Agent system with specialized sub-agents
- Mobile dashboard (Flutter)
- Email and SMS alert channels
- Historical anomaly trend analysis

---

## 👨‍💻 Team Contributions

| Member | Contribution |
|--------|-------------|
| `[Rabin Kumar J]` | Producer, Consumer, Z-Score Engine |
| `[Muhilan K]` | FastAPI Backend, SQLite, Authentication |
| `[Shriraam K C]` | React Dashboard, API Integration |
| `[Nobil S]` | AI Agent Loop, Gemini API Integration, Discord Alerts |

---

## 📄 License

This project was built for the **Infinite AI Prototype Challenge 2026** and is intended for evaluation purposes.

---

*Built with ❤️ using FastAPI, React, and SQLite*