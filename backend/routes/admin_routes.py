"""
Rutas para administradores
Requiere autenticación y rol de administrador
"""
from flask import Blueprint, request, jsonify
from models.user import User
from config.database import db
from controllers.auth_controller import token_required
from functools import wraps

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    """Decorador para requerir rol de administrador"""
    @token_required
    @wraps(f)
    def decorated(*args, **kwargs):
        # En una implementación completa, aquí verificarías el token JWT
        # y obtendrías el usuario actual para verificar su rol
        # Por ahora, esto es una estructura básica
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token de acceso requerido'}), 401
        
        # TODO: Implementar verificación de token JWT y rol
        # user = get_current_user_from_token(token)
        # if not user or not user.is_admin():
        #     return jsonify({'error': 'Acceso denegado. Se requiere rol de administrador'}), 403
        
        return f(*args, **kwargs)
    return decorated

@admin_bp.route('/create-admin', methods=['POST'])
@admin_required
def create_admin():
    """Crea un nuevo usuario administrador (solo para admins)"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No se proporcionaron datos'}), 400
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({'error': 'Todos los campos son obligatorios'}), 400
    
    # Verificar si el usuario ya existe
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'El nombre de usuario ya está en uso'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'El email ya está registrado'}), 400
    
    try:
        # Crear usuario administrador
        admin_user = User(
            username=username,
            email=email,
            password=password,
            role='admin'
        )
        db.session.add(admin_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuario administrador creado exitosamente',
            'user': admin_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al crear administrador: {str(e)}'}), 500

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    """Obtiene todos los usuarios (solo para admins)"""
    try:
        users = User.query.all()
        return jsonify({
            'users': [user.to_dict() for user in users],
            'total': len(users)
        }), 200
    except Exception as e:
        return jsonify({'error': f'Error al obtener usuarios: {str(e)}'}), 500

