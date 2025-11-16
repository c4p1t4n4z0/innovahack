"""
Agrega la columna is_read BOOLEAN DEFAULT FALSE a mentor_messages si no existe.
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app import app
from config.database import db
from sqlalchemy import text

def column_exists(conn, table, column):
    res = conn.execute(
        text("SELECT column_name FROM information_schema.columns WHERE table_name=:t AND column_name=:c"),
        {"t": table, "c": column}
    )
    return res.fetchone() is not None

def migrate():
    with app.app_context():
        with db.engine.connect() as conn:
            if column_exists(conn, "mentor_messages", "is_read"):
                print("[INFO] La columna is_read ya existe en mentor_messages")
                return
            print("[INFO] Agregando columna is_read a mentor_messages...")
            conn.execute(text("ALTER TABLE mentor_messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE NOT NULL"))
            conn.commit()
            print("[OK] Columna is_read agregada")

if __name__ == '__main__':
    print("=" * 50)
    print("Migracion: Agregar is_read a mentor_messages")
    print("=" * 50)
    migrate()
    print("=" * 50)


