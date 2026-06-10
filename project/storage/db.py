# storage/db.py
# SQLite persistence layer for the Streaming Event Anomaly Detector.
# All connections are thread-local so the producer and consumer threads
# each maintain their own SQLite connection safely.

import os
import sqlite3
import threading
from datetime import datetime
import bcrypt

# ---------------------------------------------------------------------------
# Resolve DB path relative to the project root (two levels up from this file)
# so it works both locally and inside Docker.
# ---------------------------------------------------------------------------
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(_PROJECT_ROOT, "storage", "events.db")

_local = threading.local()


def _get_conn() -> sqlite3.Connection:
    """Return (or create) a thread-local SQLite connection."""
    if not hasattr(_local, "conn") or _local.conn is None:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        _local.conn = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=20.0)
        _local.conn.row_factory = sqlite3.Row
    return _local.conn


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------
_SCHEMA = """
CREATE TABLE IF NOT EXISTS events (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id  TEXT    NOT NULL,
    timestamp REAL    NOT NULL,
    source    TEXT    DEFAULT 'producer'
);

CREATE TABLE IF NOT EXISTS anomalies (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp         REAL    NOT NULL,
    orders_per_minute INTEGER NOT NULL,
    z_score           REAL    NOT NULL,
    explanation       TEXT    DEFAULT ''
);

CREATE TABLE IF NOT EXISTS agent_decisions (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp         REAL    NOT NULL,
    orders_per_minute INTEGER NOT NULL,
    z_score           REAL    NOT NULL,
    severity          TEXT    NOT NULL,
    possible_cause    TEXT    NOT NULL,
    recommendation    TEXT    NOT NULL,
    requires_alert    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
"""


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def initialize_database() -> None:
    """Create tables if they do not already exist (idempotent) and seed default users."""
    conn = _get_conn()
    conn.executescript(_SCHEMA)
    conn.commit()
    print(f"[DB] Initialized SQLite database at: {DB_PATH}")

    # Seed default users if users table is empty
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        if count == 0:
            print("[DB] Seeding default users...")
            default_users = [
                ("admin", hash_password("admin123"), "admin"),
                ("analyst", hash_password("analyst123"), "analyst"),
                ("viewer", hash_password("viewer123"), "viewer"),
            ]
            cursor.executemany(
                "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                default_users
            )
            conn.commit()
            print("[DB] Default users seeded successfully.")
    except Exception as exc:
        print(f"[DB] Error seeding users: {exc}")


# ---------------------------------------------------------------------------
# Write helpers
# ---------------------------------------------------------------------------

def save_event(order_id: str, timestamp: float, source: str = "producer") -> None:
    """Persist a single order event."""
    try:
        conn = _get_conn()
        conn.execute(
            "INSERT INTO events (order_id, timestamp, source) VALUES (?, ?, ?)",
            (order_id, timestamp, source),
        )
        conn.commit()
    except Exception as exc:
        print(f"[DB] save_event error: {exc}")


def save_anomaly(
    timestamp: float,
    orders_per_minute: int,
    z_score: float,
    explanation: str = "",
) -> None:
    """Persist a detected anomaly."""
    try:
        conn = _get_conn()
        conn.execute(
            "INSERT INTO anomalies (timestamp, orders_per_minute, z_score, explanation) "
            "VALUES (?, ?, ?, ?)",
            (timestamp, int(orders_per_minute), float(z_score), explanation or ""),
        )
        conn.commit()
    except Exception as exc:
        print(f"[DB] save_anomaly error: {exc}")


def save_agent_decision(
    timestamp: float,
    orders_per_minute: int,
    z_score: float,
    severity: str,
    possible_cause: str,
    recommendation: str,
    requires_alert: bool,
) -> None:
    """Persist an AI Agent decision."""
    try:
        conn = _get_conn()
        conn.execute(
            "INSERT INTO agent_decisions (timestamp, orders_per_minute, z_score, severity, possible_cause, recommendation, requires_alert) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                timestamp,
                int(orders_per_minute),
                float(z_score),
                str(severity).upper(),
                possible_cause or "",
                recommendation or "",
                1 if requires_alert else 0,
            ),
        )
        conn.commit()
    except Exception as exc:
        print(f"[DB] save_agent_decision error: {exc}")


# ---------------------------------------------------------------------------
# Read helpers
# ---------------------------------------------------------------------------

def get_recent_events(limit: int = 50) -> list[dict]:
    """Return the most recent `limit` events, newest first."""
    try:
        conn = _get_conn()
        rows = conn.execute(
            "SELECT id, order_id, timestamp, source "
            "FROM events ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [
            {
                "id": r["id"],
                "order_id": r["order_id"],
                "timestamp": datetime.fromtimestamp(r["timestamp"]).strftime("%H:%M:%S.%f")[:-3],
                "source": r["source"],
            }
            for r in rows
        ]
    except Exception as exc:
        print(f"[DB] get_recent_events error: {exc}")
        return []


def get_recent_anomalies(limit: int = 20) -> list[dict]:
    """Return the most recent `limit` anomalies, newest first."""
    try:
        conn = _get_conn()
        rows = conn.execute(
            "SELECT id, timestamp, orders_per_minute, z_score, explanation "
            "FROM anomalies ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [
            {
                "id": r["id"],
                "timestamp": datetime.fromtimestamp(r["timestamp"]).strftime("%H:%M:%S"),
                "orders_per_minute": r["orders_per_minute"],
                "z_score": r["z_score"],
                "explanation": r["explanation"],
            }
            for r in rows
        ]
    except Exception as exc:
        print(f"[DB] get_recent_anomalies error: {exc}")
        return []


def get_dashboard_metrics() -> dict:
    """Return aggregated counts for dashboard KPI cards."""
    try:
        conn = _get_conn()
        total_events = conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        total_anomalies = conn.execute("SELECT COUNT(*) FROM anomalies").fetchone()[0]
        last_anomaly_row = conn.execute(
            "SELECT timestamp, z_score, orders_per_minute FROM anomalies ORDER BY id DESC LIMIT 1"
        ).fetchone()
        last_anomaly = None
        if last_anomaly_row:
            last_anomaly = {
                "timestamp": datetime.fromtimestamp(last_anomaly_row["timestamp"]).strftime(
                    "%H:%M:%S"
                ),
                "z_score": last_anomaly_row["z_score"],
                "orders_per_minute": last_anomaly_row["orders_per_minute"],
            }
        return {
            "total_events": total_events,
            "total_anomalies": total_anomalies,
            "last_anomaly": last_anomaly,
        }
    except Exception as exc:
        print(f"[DB] get_dashboard_metrics error: {exc}")
        return {"total_events": 0, "total_anomalies": 0, "last_anomaly": None}


def get_recent_agent_decisions(limit: int = 20) -> list[dict]:
    """Return the most recent `limit` agent decisions, newest first."""
    try:
        conn = _get_conn()
        rows = conn.execute(
            "SELECT id, timestamp, orders_per_minute, z_score, severity, possible_cause, recommendation, requires_alert "
            "FROM agent_decisions ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [
            {
                "id": r["id"],
                "timestamp": datetime.fromtimestamp(r["timestamp"]).strftime("%H:%M:%S"),
                "orders_per_minute": r["orders_per_minute"],
                "z_score": r["z_score"],
                "severity": r["severity"],
                "possible_cause": r["possible_cause"],
                "recommendation": r["recommendation"],
                "requires_alert": bool(r["requires_alert"]),
            }
            for r in rows
        ]
    except Exception as exc:
        print(f"[DB] get_recent_agent_decisions error: {exc}")
        return []


def get_user_by_username(username: str) -> dict | None:
    """Fetch user by username from the database."""
    try:
        conn = _get_conn()
        row = conn.execute(
            "SELECT id, username, password_hash, role, created_at FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        if row:
            return dict(row)
        return None
    except Exception as exc:
        print(f"[DB] get_user_by_username error: {exc}")
        return None


def get_all_users() -> list[dict]:
    """Retrieve all users from the database."""
    try:
        conn = _get_conn()
        rows = conn.execute(
            "SELECT id, username, role, created_at FROM users ORDER BY id ASC"
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as exc:
        print(f"[DB] get_all_users error: {exc}")
        return []


def create_user(username: str, password_hash: str, role: str) -> bool:
    """Create a new user in the database."""
    try:
        conn = _get_conn()
        conn.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            (username, password_hash, role)
        )
        conn.commit()
        return True
    except Exception as exc:
        print(f"[DB] create_user error: {exc}")
        return False


def delete_user(user_id: int) -> bool:
    """Delete a user by their user ID."""
    try:
        conn = _get_conn()
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        return True
    except Exception as exc:
        print(f"[DB] delete_user error: {exc}")
        return False
