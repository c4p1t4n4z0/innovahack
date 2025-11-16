"""
Script para crear un usuario administrador
Uso: python scripts/create_admin.py
"""
import sys
import os
from pathlib import Path

# Agregar el directorio backend al path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app import app
from models.user import User
from config.database import db

def create_admin(username, email, password):
    """Crea un usuario administrador"""
    with app.app_context():
        # Verificar si el usuario ya existe
        existing_user = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            print(f"[ERROR] El usuario '{username}' o email '{email}' ya existe")
            if existing_user.is_admin():
                print(f"   El usuario '{existing_user.username}' ya es administrador")
            else:
                print(f"   Actualizando usuario '{existing_user.username}' a administrador...")
                existing_user.role = 'admin'
                existing_user.set_password(password)
                db.session.commit()
                print(f"[OK] Usuario '{existing_user.username}' actualizado a administrador")
            return
        
        # Crear nuevo usuario administrador
        try:
            admin_user = User(
                username=username,
                email=email,
                password=password,
                role='admin'
            )
            db.session.add(admin_user)
            db.session.commit()
            print(f"[OK] Usuario administrador '{username}' creado exitosamente")
            print(f"   Email: {email}")
            print(f"   Role: admin")
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Error al crear usuario administrador: {str(e)}")

if __name__ == '__main__':
    print("=" * 50)
    print("Crear Usuario Administrador")
    print("=" * 50)
    
    # Pedir datos al usuario
    username = input("Ingresa el nombre de usuario: ").strip()
    if not username:
        print("[ERROR] El nombre de usuario es obligatorio")
        sys.exit(1)
    
    email = input("Ingresa el email: ").strip()
    if not email:
        print("[ERROR] El email es obligatorio")
        sys.exit(1)
    
    password = input("Ingresa la contraseña (minimo 6 caracteres): ").strip()
    if len(password) < 6:
        print("[ERROR] La contraseña debe tener al menos 6 caracteres")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    create_admin(username, email, password)
    print("=" * 50)

