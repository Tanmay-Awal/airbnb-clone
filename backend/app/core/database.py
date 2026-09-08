from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Handle Turso Cloud connection or Local File SQLite
db_url = settings.DATABASE_URL
is_local_sqlite = db_url.startswith("sqlite://")

if db_url.startswith("sqlite+libsql://"):
    from urllib.parse import urlparse, parse_qs
    from app.core import turso_client
    
    parsed = urlparse(db_url)
    params = parse_qs(parsed.query)
    auth_token = params.get("auth_token", [""])[0]
    
    engine = create_engine(
        "sqlite://",
        creator=lambda: turso_client.connect(db_url, auth_token),
        echo=False
    )
else:
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False} if is_local_sqlite else {},
        echo=False
    )

import time
import logging
sql_logger = logging.getLogger("db.sql")

import sys

@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.perf_counter()

@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total_time_ms = round((time.perf_counter() - context._query_start_time) * 1000, 2)
    # Highlight SQL queries taking longer than 50ms or print execution breakdown
    clean_stmt = " ".join(statement.split())
    if total_time_ms > 50:
        print(f"⚠️ [SLOW SQL {total_time_ms}ms] {clean_stmt[:120]}...", flush=True)
    else:
        print(f"🗄️ [SQL {total_time_ms}ms] {clean_stmt[:100]}...", flush=True)
    sys.stdout.flush()

# Enforce SQLite foreign keys and WAL mode on local connection
if is_local_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA busy_timeout=5000")
            cursor.close()
        except Exception:
            pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
