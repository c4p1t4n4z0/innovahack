"""
Agrega las columnas file_name, file_path, file_type, file_size a mentor_messages si no existen.
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
            columns_to_add = [
                ("file_name", "VARCHAR(255)"),
                ("file_path", "VARCHAR(500)"),
                ("file_type", "VARCHAR(50)"),
                ("file_size", "INTEGER")
            ]
            
            for column_name, column_type in columns_to_add:
                if column_exists(conn, "mentor_messages", column_name):
                    print(f"[INFO] La columna {column_name} ya existe en mentor_messages")
                else:
                    print(f"[INFO] Agregando columna {column_name} a mentor_messages...")
                    conn.execute(text(f"ALTER TABLE mentor_messages ADD COLUMN {column_name} {column_type}"))
                    conn.commit()
                    print(f"[OK] Columna {column_name} agregada")
            
            # También necesitamos hacer que content sea nullable si aún no lo es
            # Verificamos primero si es nullable
            res = conn.execute(
                text("""
                    SELECT is_nullable 
                    FROM information_schema.columns 
                    WHERE table_name = 'mentor_messages' AND column_name = 'content'
                """)
            )
            result = res.fetchone()
            if result and result[0] == 'NO':
                print("[INFO] Modificando columna content para permitir NULL...")
                conn.execute(text("ALTER TABLE mentor_messages ALTER COLUMN content DROP NOT NULL"))
                conn.commit()
                print("[OK] Columna content ahora permite NULL")

if __name__ == '__main__':
    print("=" * 50)
    print("Migracion: Agregar campos de archivo a mentor_messages")
    print("=" * 50)
    migrate()
    print("=" * 50)

