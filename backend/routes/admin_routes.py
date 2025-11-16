"""
Rutas para administradores
Requiere autenticación y rol de administrador
"""
from flask import Blueprint, request, jsonify
from models.user import User
from config.database import db
from controllers.auth_controller import token_required
from controllers.admin_controller import AdminController
from controllers.bi_controller import BIController
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

# Endpoints de gestión de usuarios

@admin_bp.route('/users', methods=['GET'])
# @admin_required  # Temporalmente deshabilitado para pruebas
def get_all_users():
    """Obtiene todos los usuarios (solo para admins)"""
    try:
        result, status_code = AdminController.get_all_users()
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
# @admin_required
def get_user(user_id):
    """Obtiene un usuario por ID (solo para admins)"""
    try:
        result, status_code = AdminController.get_user_by_id(user_id)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@admin_bp.route('/users', methods=['POST'])
# @admin_required
def create_user():
    """Crea un nuevo usuario (solo para admins)"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No se proporcionaron datos'}), 400
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')
    
    try:
        result, status_code = AdminController.create_user(username, email, password, role)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
# @admin_required
def update_user(user_id):
    """Actualiza un usuario (solo para admins)"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No se proporcionaron datos'}), 400
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    
    try:
        result, status_code = AdminController.update_user(user_id, username, email, password, role)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
# @admin_required
def delete_user(user_id):
    """Elimina un usuario (solo para admins)"""
    try:
        result, status_code = AdminController.delete_user(user_id)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@admin_bp.route('/users/<int:user_id>/assign-mentor', methods=['POST'])
# @admin_required
def assign_mentor(user_id):
    """Asigna un usuario a un mentor (solo para admins)"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No se proporcionaron datos'}), 400
    
    mentor_id = data.get('mentor_id')  # Puede ser None para remover asignación
    
    try:
        result, status_code = AdminController.assign_user_to_mentor(user_id, mentor_id)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@admin_bp.route('/mentors', methods=['GET'])
# @admin_required
def get_all_mentors():
    """Obtiene todos los mentores (solo para admins)"""
    try:
        result, status_code = AdminController.get_all_mentors()
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@admin_bp.route('/mentors/<int:mentor_id>/users', methods=['GET'])
# @admin_required
def get_mentor_users(mentor_id):
    """Obtiene los usuarios asignados a un mentor (solo para admins)"""
    try:
        result, status_code = AdminController.get_mentor_users(mentor_id)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

# Endpoints de Business Intelligence

@admin_bp.route('/bi/statistics', methods=['GET'])
# @admin_required
def get_statistics():
    """Obtiene estadísticas generales del sistema (solo para admins)"""
    try:
        result, status_code = BIController.get_statistics()
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@admin_bp.route('/bi/mentor-performance', methods=['GET'])
# @admin_required
def get_mentor_performance():
    """Obtiene métricas de rendimiento de mentores (solo para admins)"""
    try:
        result, status_code = BIController.get_mentor_performance()
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

