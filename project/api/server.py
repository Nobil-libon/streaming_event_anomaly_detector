# api/server.py
# FastAPI bridge between the existing producer/consumer backend and the React dashboard.
# Starts producer + consumer on daemon threads (same as main.py) and exposes:
#   GET  /api/status  →  current shared_state as JSON  (polled every second by frontend)
#   WS   /ws          →  pushes shared_state JSON every second (WebSocket live feed)
#
# Run:  uvicorn api.server:app --reload --host 0.0.0.0 --port 8000

import asyncio
import json
import threading
from datetime import datetime, timedelta

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
import bcrypt

from stream.producer import producer
from detection.consumer import consumer, shared_state
from storage.db import (
    initialize_database,
    get_recent_events,
    get_recent_anomalies,
    get_dashboard_metrics,
    get_recent_agent_decisions,
    hash_password,
    get_user_by_username,
    get_all_users,
    create_user,
    delete_user,
)

app = FastAPI(title="Streaming Event Anomaly Detector API")

# ---------------------------------------------------------------------------
# Security & JWT Configuration
# ---------------------------------------------------------------------------
JWT_SECRET = "super-secret-key-for-streaming-event-anomaly-detector"
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60

security = HTTPBearer()


class LoginRequest(BaseModel):
    username: str
    password: str


class UserCreateRequest(BaseModel):
    username: str
    password: str
    role: str


class ThresholdRequest(BaseModel):
    threshold: float


class AlertRequest(BaseModel):
    message: str


def create_access_token(data: dict) -> str:
    """Generate a signed JWT token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Validate token and return user details."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("username")
        role: str = payload.get("role")
        if username is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access token credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {"username": username, "role": role}
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_roles(allowed_roles: list[str]):
    """Authorize access based on roles."""
    def dependency(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return dependency

# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server (port 5173) to call this API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Start producer + consumer threads on startup (same as main.py)
# ---------------------------------------------------------------------------
@app.on_event("startup")
def start_background_threads():
    initialize_database()
    producer_thread = threading.Thread(target=producer, daemon=True)
    consumer_thread = threading.Thread(target=consumer, daemon=True)
    producer_thread.start()
    consumer_thread.start()
    print("[OK] Producer and Consumer threads started.")


# ---------------------------------------------------------------------------
# REST endpoint — polled by frontend every second as fallback
# ---------------------------------------------------------------------------
@app.get("/api/status")
def get_status():
    return shared_state


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
@app.post("/login")
def login(request: LoginRequest):
    """Log in a user and return a JWT access token."""
    user = get_user_by_username(request.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    # verify bcrypt password
    pwd_bytes = request.password.encode('utf-8')
    hashed_bytes = user["password_hash"].encode('utf-8')
    if not bcrypt.checkpw(pwd_bytes, hashed_bytes):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    # generate token
    token = create_access_token({"username": user["username"], "role": user["role"]})
    return {"access_token": token, "role": user["role"]}


# ---------------------------------------------------------------------------
# SQLite-backed REST endpoints (Protected)
# ---------------------------------------------------------------------------
@app.get("/metrics")
def get_metrics(current_user: dict = Depends(get_current_user)):
    """Aggregated counts from SQLite (total events, anomalies, last anomaly)."""
    return get_dashboard_metrics()


@app.get("/events")
def get_events(limit: int = 50, current_user: dict = Depends(get_current_user)):
    """Most recent order events from SQLite, newest first."""
    return get_recent_events(limit=limit)


@app.get("/anomalies")
def get_anomalies(limit: int = 20, current_user: dict = Depends(get_current_user)):
    """Most recent anomalies from SQLite, newest first."""
    return get_recent_anomalies(limit=limit)


@app.get("/agent-decisions")
def get_agent_decisions(limit: int = 20, current_user: dict = Depends(require_roles(["admin", "analyst"]))):
    """Most recent SRE Agent decisions from SQLite, newest first."""
    return get_recent_agent_decisions(limit=limit)


# ---------------------------------------------------------------------------
# Administrative & Control Panel Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/threshold")
def change_threshold(request: ThresholdRequest, current_user: dict = Depends(require_roles(["admin"]))):
    """Dynamically update Z-Score threshold inside the consumer loop."""
    import detection.consumer
    detection.consumer.Z_SCORE_THRESHOLD = request.threshold
    detection.consumer.shared_state["threshold"] = request.threshold
    print(f"[CONFIG] Detection threshold changed to {request.threshold} by {current_user['username']}")
    return {"status": "success", "threshold": request.threshold}


@app.post("/api/alerts/manual")
def trigger_manual_alert(request: AlertRequest, current_user: dict = Depends(require_roles(["admin", "analyst"]))):
    """Manually dispatch a custom alert message to Discord webhook."""
    from alerts.discord_alert import send_discord_alert
    try:
        opm = shared_state.get("opm", 0)
        z_score = shared_state.get("z_score", 0.0)
        send_discord_alert(
            opm=opm,
            z_score=z_score,
            severity=f"MANUAL ({current_user['role'].upper()})",
            recommendation=request.message
        )
        print(f"[ALERT] Manual alert dispatched by {current_user['username']}")
        return {"status": "success", "detail": "Discord manual alert triggered successfully"}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send manual alert: {exc}"
        )


@app.get("/api/users")
def list_users(current_user: dict = Depends(require_roles(["admin"]))):
    """Retrieve all users in the system."""
    return get_all_users()


@app.post("/api/users")
def add_user(request: UserCreateRequest, current_user: dict = Depends(require_roles(["admin"]))):
    """Create a new user in the database."""
    # Check if user already exists
    existing = get_user_by_username(request.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    # Hash password
    hashed = hash_password(request.password)
    success = create_user(request.username, hashed, request.role)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    return {"status": "success", "username": request.username, "role": request.role}


@app.delete("/api/users/{user_id}")
def remove_user(user_id: int, current_user: dict = Depends(require_roles(["admin"]))):
    """Delete a user, preventing lockout of default accounts and self-deletion."""
    users = get_all_users()
    target_user = next((u for u in users if u["id"] == user_id), None)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    # Prevent deleting system defaults
    if target_user["username"] in ["admin", "analyst", "viewer"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete default system users"
        )
    # Prevent deleting self
    if target_user["username"] == current_user["username"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
        
    success = delete_user(user_id)
    if not success:
         raise HTTPException(
             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
             detail="Failed to delete user"
         )
    return {"status": "success"}


# ---------------------------------------------------------------------------
# WebSocket endpoint — primary real-time feed
# ---------------------------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_text(json.dumps(shared_state))
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
