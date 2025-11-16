"""
Rutas para gestión del propio perfil de usuario (rol 'user')
"""
from flask import Blueprint, request, jsonify
from controllers.user_controller import UserController
from models.user import User
from models.mentor_message import MentorMessage
from config.database import db
from sqlalchemy import func

user_bp = Blueprint('user', __name__)

@user_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    try:
        result, status = UserController.get_profile(user_id)
        return jsonify(result), status
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@user_bp.route('/profile/<int:user_id>', methods=['PUT'])
def update_profile(user_id):
    data = request.get_json() or {}
    try:
        result, status = UserController.update_profile(
            user_id=user_id,
            username=data.get('username'),
            email=data.get('email'),
            password=data.get('password')
        )
        return jsonify(result), status
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@user_bp.route('/business/<int:user_id>', methods=['PUT'])
def update_business(user_id):
    data = request.get_json() or {}
    try:
        result, status = UserController.update_business(
            user_id=user_id,
            name=data.get('name'),
            category=data.get('category'),
            description=data.get('description')
        )
        return jsonify(result), status
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@user_bp.route('/mentor-invitations/<int:user_id>', methods=['GET'])
def list_my_invitations(user_id):
    try:
        result, status = UserController.list_my_invitations(user_id)
        return jsonify(result), status
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@user_bp.route('/request-mentor', methods=['POST'])
def request_mentor():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    mentor_id = data.get('mentor_id')
    message = data.get('message')
    if not user_id or not mentor_id:
        return jsonify({'error': 'user_id y mentor_id son requeridos'}), 400
    try:
        result, status = UserController.request_mentor(user_id=int(user_id), mentor_id=int(mentor_id), message=message)
        return jsonify(result), status
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@user_bp.route('/messages/<int:user_id>', methods=['GET'])
def list_messages(user_id):
    """Lista mensajes entre el usuario y su mentora"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        if not user.mentor_id:
            return jsonify({'messages': [], 'total': 0}), 200
        msgs = (MentorMessage.query
                .filter_by(user_id=user.id, mentor_id=user.mentor_id)
                .order_by(MentorMessage.created_at.asc())
                .all())
        return jsonify({'messages': [m.to_dict() for m in msgs], 'total': len(msgs)}), 200
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@user_bp.route('/messages', methods=['POST'])
def send_message():
    """Envía un mensaje del usuario a su mentora"""
    data = request.get_json() or {}
    user_id = data.get('user_id')
    content = (data.get('content') or '').strip()
    if not user_id or not content:
        return jsonify({'error': 'user_id y content son requeridos'}), 400
    try:
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        if not user.mentor_id:
            return jsonify({'error': 'Aún no tienes mentora asignada'}), 400
        msg = MentorMessage(
            user_id=user.id,
            mentor_id=user.mentor_id,
            sender_id=user.id,
            content=content,
            is_read=False  # no leído por la mentora
        )
        db.session.add(msg)
        db.session.commit()
        return jsonify({'message': 'Enviado', 'data': msg.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@user_bp.route('/messages/read', methods=['POST'])
def mark_messages_read_user():
    """Marca como leídos los mensajes del mentor hacia el usuario"""
    data = request.get_json() or {}
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id es requerido'}), 400
    try:
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        if not user.mentor_id:
            return jsonify({'updated': 0}), 200
        updated = (MentorMessage.query
                   .filter_by(user_id=user.id, mentor_id=user.mentor_id)
                   .filter(MentorMessage.sender_id == user.mentor_id, MentorMessage.is_read.is_(False))
                   .update({MentorMessage.is_read: True}, synchronize_session=False))
        db.session.commit()
        return jsonify({'message': 'Mensajes marcados como leídos', 'updated': int(updated)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@user_bp.route('/messages/unread-count/<int:user_id>', methods=['GET'])
def unread_count_user(user_id):
    """Devuelve la cantidad de mensajes no leídos del mentor al usuario"""
    try:
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        if not user.mentor_id:
            return jsonify({'unread': 0}), 200
        count = (db.session.query(func.count(MentorMessage.id))
                 .filter_by(user_id=user.id, mentor_id=user.mentor_id)
                 .filter(MentorMessage.sender_id == user.mentor_id, MentorMessage.is_read.is_(False))
                 .scalar()) or 0
        return jsonify({'unread': int(count)}), 200
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

#


