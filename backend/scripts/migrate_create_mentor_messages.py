"""
Crea la tabla mentor_messages si no existe.
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app import app
from config.database import db
from sqlalchemy import text

def table_exists(connection, table_name: str) -> bool:
    result = connection.execute(
        text("SELECT to_regclass(:tname)"),
        {"tname": table_name}
    )
    row = result.fetchone()
    return row and row[0] is not None

def migrate():
    with app.app_context():
        with db.engine.connect() as conn:
            if table_exists(conn, "mentor_messages"):
                print("[INFO] 'mentor_messages' ya existe")
                return
            print("[INFO] Creando tabla 'mentor_messages'...")
            conn.execute(text("""
                CREATE TABLE mentor_messages (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
                );
            """))
            conn.commit()
            print("[OK] Tabla 'mentor_messages' creada")

if __name__ == '__main__':
    print("=" * 50)
    print("Migracion: Crear tabla mentor_messages")
    print("=" * 50)
    migrate()
    print("=" * 50)


