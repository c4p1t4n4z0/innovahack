"""
Script para crear la tabla mentor_invitations si no existe.
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
        text(
            "SELECT to_regclass(:table_name)"
        ),
        {"table_name": table_name}
    )
    row = result.fetchone()
    return row and row[0] is not None

def migrate_create_mentor_invitations():
    with app.app_context():
        try:
            with db.engine.connect() as connection:
                if table_exists(connection, "mentor_invitations"):
                    print("[INFO] La tabla 'mentor_invitations' ya existe")
                    return
                print("[INFO] Creando tabla 'mentor_invitations'...")
                connection.execute(text("""
                    CREATE TABLE mentor_invitations (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        status VARCHAR(20) NOT NULL DEFAULT 'pending',
                        message VARCHAR(255),
                        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                        responded_at TIMESTAMP WITHOUT TIME ZONE
                    );
                """))
                connection.commit()
                print("[OK] Tabla 'mentor_invitations' creada")
        except Exception as e:
            print(f"[ERROR] Error al crear tabla 'mentor_invitations': {str(e)}")
            raise

if __name__ == '__main__':
    print("=" * 50)
    print("Migracion: Crear tabla mentor_invitations")
    print("=" * 50)
    migrate_create_mentor_invitations()
    print("=" * 50)


