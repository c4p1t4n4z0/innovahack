"""
Script simplificado para crear un usuario administrador
Uso: python scripts/create_admin_simple.py
"""
import sys
from pathlib import Path

# Agregar el directorio backend al path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app import app
from models.user import User
from config.database import db

def create_admin(username='admin', email='admin@proyecto.com', password='admin123'):
    """Crea un usuario administrador con valores por defecto"""
    with app.app_context():
        # Verificar si el usuario ya existe
        existing_user = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            print(f"[INFO] El usuario '{username}' o email '{email}' ya existe")
            if existing_user.is_admin():
                print(f"[OK] El usuario '{existing_user.username}' ya es administrador")
            else:
                print(f"[INFO] Actualizando usuario '{existing_user.username}' a administrador...")
                existing_user.role = 'admin'
                existing_user.set_password(password)
                db.session.commit()
                print(f"[OK] Usuario '{existing_user.username}' actualizado a administrador")
            return existing_user
        
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
            return admin_user
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Error al crear usuario administrador: {str(e)}")
            raise

if __name__ == '__main__':
    print("=" * 50)
    print("Crear Usuario Administrador")
    print("=" * 50)
    
    # Verificar si se pasaron argumentos
    if len(sys.argv) >= 4:
        username = sys.argv[1]
        email = sys.argv[2]
        password = sys.argv[3]
        print(f"Usando parametros:")
        print(f"  Usuario: {username}")
        print(f"  Email: {email}")
        print(f"  Contraseña: {'*' * len(password)}")
    else:
        print("Valores por defecto:")
        print("  Usuario: admin")
        print("  Email: admin@proyecto.com")
        print("  Contraseña: admin123")
        print("\n[INFO] Para personalizar, ejecuta:")
        print("  python scripts/create_admin_simple.py <usuario> <email> <contraseña>")
        print("=" * 50)
        
        # Usar valores por defecto
        username = 'admin'
        email = 'admin@proyecto.com'
        password = 'admin123'
    
    if len(password) < 6:
        print("[ERROR] La contraseña debe tener al menos 6 caracteres")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    create_admin(username, email, password)
    print("=" * 50)

