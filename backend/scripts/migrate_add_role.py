"""
Script para agregar la columna 'role' a la tabla users
Si la columna ya existe, no hace nada
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app import app
from config.database import db
from sqlalchemy import text

def migrate_add_role():
    """Agrega la columna role si no existe"""
    with app.app_context():
        try:
            # Verificar si la columna ya existe
            with db.engine.connect() as connection:
                result = connection.execute(
                    text("SELECT column_name FROM information_schema.columns "
                         "WHERE table_name='users' AND column_name='role'")
                )
                
                if result.fetchone():
                    print("[INFO] La columna 'role' ya existe en la tabla 'users'")
                    return
                
                # Agregar la columna role
                print("[INFO] Agregando columna 'role' a la tabla 'users'...")
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' NOT NULL")
                )
                connection.commit()
                print("[OK] Columna 'role' agregada exitosamente")
                
                # Actualizar usuarios existentes a 'user' por defecto (si es necesario)
                connection.execute(
                    text("UPDATE users SET role = 'user' WHERE role IS NULL")
                )
                connection.commit()
                print("[OK] Usuarios existentes actualizados con role='user'")
            
        except Exception as e:
            print(f"[ERROR] Error al agregar columna 'role': {str(e)}")
            raise

if __name__ == '__main__':
    print("=" * 50)
    print("Migracion: Agregar columna 'role'")
    print("=" * 50)
    migrate_add_role()
    print("=" * 50)

