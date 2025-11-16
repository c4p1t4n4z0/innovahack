from models.user import User
from config.database import db
from flask import jsonify
from functools import wraps
from flask import request
import re

class AuthController:
    """Controlador para autenticación"""
    
    @staticmethod
    def register(username, email, password, role='user'):
        """Registra un nuevo usuario"""
        # Validaciones
        if not username or not email or not password:
            return {'error': 'Todos los campos son obligatorios'}, 400
        
        if len(password) < 6:
            return {'error': 'La contraseña debe tener al menos 6 caracteres'}, 400
        
        # Validar formato de email
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return {'error': 'Email inválido'}, 400
        
        # Validar role (solo 'admin', 'mentor' o 'user')
        if role not in ['admin', 'mentor', 'user']:
            role = 'user'  # Por defecto user si el role no es válido
        
        # Verificar si el usuario ya existe
        if User.query.filter_by(username=username).first():
            return {'error': 'El nombre de usuario ya está en uso'}, 400
        
        if User.query.filter_by(email=email).first():
            return {'error': 'El email ya está registrado'}, 400
        
        try:
            # Crear nuevo usuario
            new_user = User(username=username, email=email, password=password, role=role)
            db.session.add(new_user)
            db.session.commit()
            
            return {'message': 'Usuario registrado correctamente', 'user': new_user.to_dict()}, 201
        except Exception as e:
            db.session.rollback()
            return {'error': f'Error al registrar usuario: {str(e)}'}, 500
    
    @staticmethod
    def login(username, password):
        """Autentica un usuario"""
        if not username or not password:
            return {'error': 'Usuario y contraseña son obligatorios'}, 400
        
        # Buscar usuario por username o email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user or not user.check_password(password):
            return {'error': 'Credenciales inválidas'}, 401
        
        # En una aplicación real, aquí generarías un token JWT
        return {
            'message': 'Login exitoso',
            'user': user.to_dict()
        }, 200
    
    @staticmethod
    def get_user_by_id(user_id):
        """Obtiene un usuario por ID"""
        user = User.query.get(user_id)
        if not user:
            return {'error': 'Usuario no encontrado'}, 404
        return {'user': user.to_dict()}, 200

def token_required(f):
    """Decorador para proteger rutas que requieren autenticación"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # En una implementación completa, aquí verificarías el token JWT
        # Por ahora, esta es una estructura básica
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token de acceso requerido'}), 401
        
        # Aquí validarías el token JWT real
        # user_id = verify_token(token)
        # ...
        
        return f(*args, **kwargs)
    return decorated

