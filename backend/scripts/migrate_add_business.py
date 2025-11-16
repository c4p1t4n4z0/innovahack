"""
Script para agregar columnas de emprendimiento al usuario:
- business_name VARCHAR(150)
- business_category VARCHAR(80)
- business_description TEXT
Si las columnas ya existen, no hace nada.
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app import app
from config.database import db
from sqlalchemy import text

def column_exists(connection, table_name: str, column_name: str) -> bool:
    result = connection.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name=:table AND column_name=:column"
        ),
        {"table": table_name, "column": column_name},
    )
    return result.fetchone() is not None

def migrate_add_business_fields():
    """Agrega columnas de emprendimiento a users si no existen"""
    with app.app_context():
        try:
            with db.engine.connect() as connection:
                # business_name
                if not column_exists(connection, "users", "business_name"):
                    print("[INFO] Agregando columna 'business_name' a 'users'...")
                    connection.execute(
                        text("ALTER TABLE users ADD COLUMN business_name VARCHAR(150)")
                    )
                    connection.commit()
                    print("[OK] Columna 'business_name' agregada")
                else:
                    print("[INFO] La columna 'business_name' ya existe")

                # business_category
                if not column_exists(connection, "users", "business_category"):
                    print("[INFO] Agregando columna 'business_category' a 'users'...")
                    connection.execute(
                        text("ALTER TABLE users ADD COLUMN business_category VARCHAR(80)")
                    )
                    connection.commit()
                    print("[OK] Columna 'business_category' agregada")
                else:
                    print("[INFO] La columna 'business_category' ya existe")

                # business_description
                if not column_exists(connection, "users", "business_description"):
                    print("[INFO] Agregando columna 'business_description' a 'users'...")
                    connection.execute(
                        text("ALTER TABLE users ADD COLUMN business_description TEXT")
                    )
                    connection.commit()
                    print("[OK] Columna 'business_description' agregada")
                else:
                    print("[INFO] La columna 'business_description' ya existe")

        except Exception as e:
            print(f"[ERROR] Error al agregar campos de emprendimiento: {str(e)}")
            raise

if __name__ == '__main__':
    print("=" * 50)
    print("Migracion: Agregar campos de emprendimiento a users")
    print("=" * 50)
    migrate_add_business_fields()
    print("=" * 50)


