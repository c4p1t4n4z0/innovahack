"""
Script para verificar usuarios administradores
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app import app
from models.user import User
from config.database import db

def verify_admins():
    """Muestra todos los usuarios administradores"""
    with app.app_context():
        admins = User.query.filter_by(role='admin').all()
        
        if not admins:
            print("[INFO] No hay usuarios administradores en la base de datos")
            return
        
        print("=" * 50)
        print(f"Usuarios Administradores ({len(admins)}):")
        print("=" * 50)
        
        for admin in admins:
            print(f"ID: {admin.id}")
            print(f"Usuario: {admin.username}")
            print(f"Email: {admin.email}")
            print(f"Role: {admin.role}")
            print(f"Creado: {admin.created_at}")
            print("-" * 50)

if __name__ == '__main__':
    verify_admins()

