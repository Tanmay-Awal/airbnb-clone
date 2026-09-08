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
