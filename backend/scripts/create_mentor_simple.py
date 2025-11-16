"""
Script simplificado para crear un usuario mentor
Uso: python scripts/create_mentor_simple.py
"""
import sys
from pathlib import Path

# Agregar el directorio backend al path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app import app
from models.user import User
from config.database import db

def create_mentor(username='mentor', email='mentor@proyecto.com', password='mentor123'):
    """Crea un usuario mentor con valores por defecto"""
    with app.app_context():
        # Verificar si el usuario ya existe
        existing_user = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            print(f"[INFO] El usuario '{username}' o email '{email}' ya existe")
            if existing_user.is_mentor():
                print(f"[OK] El usuario '{existing_user.username}' ya es mentor")
            else:
                print(f"[INFO] Actualizando usuario '{existing_user.username}' a mentor...")
                existing_user.role = 'mentor'
                existing_user.set_password(password)
                db.session.commit()
                print(f"[OK] Usuario '{existing_user.username}' actualizado a mentor")
            return existing_user
        
        # Crear nuevo usuario mentor
        try:
            mentor_user = User(
                username=username,
                email=email,
                password=password,
                role='mentor'
            )
            db.session.add(mentor_user)
            db.session.commit()
            print(f"[OK] Usuario mentor '{username}' creado exitosamente")
            print(f"   Email: {email}")
            print(f"   Role: mentor")
            return mentor_user
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Error al crear usuario mentor: {str(e)}")
            raise

if __name__ == '__main__':
    print("=" * 50)
    print("Crear Usuario Mentor")
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
        print("  Usuario: mentor")
        print("  Email: mentor@proyecto.com")
        print("  Contraseña: mentor123")
        print("\n[INFO] Para personalizar, ejecuta:")
        print("  python scripts/create_mentor_simple.py <usuario> <email> <contraseña>")
        print("=" * 50)
        
        # Usar valores por defecto
        username = 'mentor'
        email = 'mentor@proyecto.com'
        password = 'mentor123'
    
    if len(password) < 6:
        print("[ERROR] La contraseña debe tener al menos 6 caracteres")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    create_mentor(username, email, password)
    print("=" * 50)

