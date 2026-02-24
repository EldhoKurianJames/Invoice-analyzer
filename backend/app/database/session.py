import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env file
load_dotenv()

# Use Supabase/Postgres when `SUPABASE_DB_URL` or `DATABASE_URL` is provided in the environment.
# Fall back to the existing local SQLite file for development.
_DB_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
os.makedirs(_DB_DIR, exist_ok=True)
DEFAULT_SQLITE = f"sqlite:///{os.path.abspath(os.path.join(_DB_DIR, 'invoices.db'))}"
DATABASE_URL = os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL") or DEFAULT_SQLITE

if DATABASE_URL.startswith("sqlite"):
    # sqlite needs the check_same_thread option
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # For Postgres (Supabase) use a robust engine config
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
