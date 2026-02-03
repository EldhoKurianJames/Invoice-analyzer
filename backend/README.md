# Invoice AI Backend

Python FastAPI backend for intelligent invoice processing.

## Features

- OCR text extraction (Tesseract)
- Table extraction (Camelot/Tabula)
- Business rule validation
- Digital signature application
- PDF error highlighting
- Database integration

## Setup

1. Create virtual environment: `python -m venv venv`
2. Activate: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Linux/Mac)
3. Install dependencies: `pip install -r requirements.txt`
4. Run server: `python app/main.py`

## Using Supabase/Postgres

- To use a Supabase Postgres database instead of the default local SQLite file, set the `SUPABASE_DB_URL` environment variable to your Supabase Postgres connection URL (or `DATABASE_URL`).
- Example (PowerShell):

```powershell
$env:SUPABASE_DB_URL = "postgresql://username:password@db.host.supabase.co:5432/postgres"
```

- If `SUPABASE_DB_URL` is not set the app will continue to use the bundled SQLite file at `data/invoices.db`.

### Migrating existing local data to Supabase

If you already have invoices stored locally in `data/invoices.db` you can copy them into your Supabase Postgres using the included migration script.

PowerShell example (replace with your real values):

```powershell
cd D:\minialternate\invoice-ai\backend
$env:SUPABASE_DB_URL = "postgresql://postgres:essaeldhoswarna@db.vsgsedyjlmydnshxpmds.supabase.co:5432/postgres?sslmode=require"
python scripts\migrate_to_supabase.py --force
```

The script will:
- create tables in the Supabase Postgres if they don't exist
- copy rows from the local SQLite tables to Supabase
- fix Postgres serial sequences so `id` continues from the max value

Use `--force` to delete existing rows on Supabase before copying.

## Project Structure

- `app/` - Main application code
- `data/` - Data storage directories
- `tests/` - Test files
