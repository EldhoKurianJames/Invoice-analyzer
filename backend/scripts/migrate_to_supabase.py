import os
import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

import sys

# Adjust import path to find app package when running from scripts/
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app.database import models

DEFAULT_SQLITE = "sqlite:///d:/minipro/invoice-ai/backend/data/invoices.db"


def get_engine(url):
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True)


def copy_model_data(model, src_session, dst_session, force=False):
    table_name = model.__tablename__
    print(f"Copying table: {table_name}")
    if force:
        print(f" - Deleting existing rows in destination.{table_name}")
        dst_session.execute(text(f"DELETE FROM {table_name};"))
        dst_session.commit()

    rows = src_session.query(model).all()
    print(f" - {len(rows)} rows found in source")
    count = 0
    for r in rows:
        # Build a dict of column -> value excluding SQLAlchemy state
        data = {}
        for col in r.__table__.columns:
            data[col.name] = getattr(r, col.name)

        # Create destination object with same values (preserve ids)
        obj = model(**data)
        dst_session.add(obj)
        count += 1
    dst_session.commit()
    print(f" - Inserted {count} rows into destination.{table_name}")


def fix_sequences(pg_engine, models_list):
    with pg_engine.connect() as conn:
        for m in models_list:
            seq_sql = f"SELECT setval(pg_get_serial_sequence('{m.__tablename__}','id'), COALESCE((SELECT MAX(id) FROM {m.__tablename__}), 1));"
            try:
                conn.execute(text(seq_sql))
                print(f" - Sequence fixed for {m.__tablename__}")
            except Exception as e:
                print(f" - Failed to fix sequence for {m.__tablename__}: {e}")


def main():
    parser = argparse.ArgumentParser(description="Migrate local SQLite DB to Supabase Postgres")
    parser.add_argument("--sqlite-url", default=os.environ.get("SQLITE_URL") or DEFAULT_SQLITE)
    parser.add_argument("--pg-url", default=os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL"))
    parser.add_argument("--force", action="store_true", help="Delete existing rows in destination before copying")

    args = parser.parse_args()

    if not args.pg_url:
        print("ERROR: No Postgres URL provided. Set SUPABASE_DB_URL or pass --pg-url")
        return

    print(f"Using sqlite: {args.sqlite_url}")
    print(f"Using postgres: {args.pg_url}")

    sqlite_engine = get_engine(args.sqlite_url)
    pg_engine = get_engine(args.pg_url)

    # Create destination tables
    print("Creating tables in destination (if not present)...")
    models.Base.metadata.create_all(bind=pg_engine)

    # Sessions
    SqliteSession = sessionmaker(bind=sqlite_engine)
    PgSession = sessionmaker(bind=pg_engine)

    src = SqliteSession()
    dst = PgSession()

    try:
        model_list = [
            models.Invoice,
            models.PriceHistory,
            models.VendorScore,
            models.InvoiceApproval,
            models.InvoiceLineItem,
        ]

        for m in model_list:
            copy_model_data(m, src, dst, force=args.force)

        print("Fixing serial sequences on Postgres...")
        fix_sequences(pg_engine, model_list)

        print("Migration complete.")
    finally:
        src.close()
        dst.close()


if __name__ == "__main__":
    main()
