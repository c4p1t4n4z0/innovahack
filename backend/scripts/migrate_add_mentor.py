"""
Script para agregar la columna 'mentor_id' a la tabla users
Si la columna ya existe, no hace nada
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app import app
from config.database import db
from sqlalchemy import text

def migrate_add_mentor():
    """Agrega la columna mentor_id si no existe"""
    with app.app_context():
        try:
            # Verificar si la columna ya existe
            with db.engine.connect() as connection:
                result = connection.execute(
                    text("SELECT column_name FROM information_schema.columns "
                         "WHERE table_name='users' AND column_name='mentor_id'")
                )
                
                if result.fetchone():
                    print("[INFO] La columna 'mentor_id' ya existe en la tabla 'users'")
                    return
                
                # Agregar la columna mentor_id
                print("[INFO] Agregando columna 'mentor_id' a la tabla 'users'...")
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN mentor_id INTEGER REFERENCES users(id)")
                )
                connection.commit()
                print("[OK] Columna 'mentor_id' agregada exitosamente")
                
        except Exception as e:
            print(f"[ERROR] Error al agregar columna 'mentor_id': {str(e)}")
            raise

if __name__ == '__main__':
    print("=" * 50)
    print("Migracion: Agregar columna 'mentor_id'")
    print("=" * 50)
    migrate_add_mentor()
    print("=" * 50)

