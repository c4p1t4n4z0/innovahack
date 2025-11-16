"""
Rutas para mentores
Los mentores solo pueden ver y gestionar sus usuarios asignados
"""
from flask import Blueprint, request, jsonify
from models.user import User
from config.database import db
from controllers.auth_controller import token_required
from functools import wraps

mentor_bp = Blueprint('mentor', __name__)

def mentor_required(f):
    """Decorador para requerir rol de mentor"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        # Por ahora, permitir acceso (el token_required se implementará después)
        # En producción, verificar que el usuario tenga rol 'mentor'
        return f(*args, **kwargs)
    return decorated

@mentor_bp.route('/my-users', methods=['GET'])
# @mentor_required
def get_my_users():
    """Obtiene los usuarios asignados al mentor actual (solo para mentores)"""
    try:
        # Por ahora, obtener el mentor_id desde query params o header
        # En producción, obtener del token JWT
        mentor_id = request.args.get('mentor_id')
        
        if not mentor_id:
            return jsonify({'error': 'ID de mentor requerido'}), 400
        
        mentor = User.query.get(mentor_id)
        if not mentor:
            return jsonify({'error': 'Mentor no encontrado'}), 404
        
        if mentor.role != 'mentor':
            return jsonify({'error': 'El usuario no es un mentor'}), 403
        
        # Obtener usuarios asignados
        assigned_users = User.query.filter_by(mentor_id=mentor_id, role='user').all()
        
        users_data = [user.to_dict(include_mentor=False) for user in assigned_users]
        
        return jsonify({
            'mentor': {
                'id': mentor.id,
                'username': mentor.username,
                'email': mentor.email
            },
            'users': users_data,
            'total': len(users_data)
        }), 200
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@mentor_bp.route('/my-users/<int:user_id>', methods=['GET'])
# @mentor_required
def get_my_user(user_id):
    """Obtiene un usuario específico asignado al mentor (solo para mentores)"""
    try:
        mentor_id = request.args.get('mentor_id')
        
        if not mentor_id:
            return jsonify({'error': 'ID de mentor requerido'}), 400
        
        try:
            mentor_id = int(mentor_id)
        except ValueError:
            return jsonify({'error': 'ID de mentor inválido'}), 400
        
        mentor = User.query.get(mentor_id)
        if not mentor or mentor.role != 'mentor':
            return jsonify({'error': 'Mentor no válido'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Verificar que el usuario esté asignado a este mentor
        if user.mentor_id != mentor.id:
            return jsonify({'error': 'Este usuario no está asignado a ti'}), 403
        
        return jsonify(user.to_dict(include_mentor=False)), 200
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

