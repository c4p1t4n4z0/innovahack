"""
Rutas para mentores
Los mentores solo pueden ver y gestionar sus usuarios asignados
"""
from flask import Blueprint, request, jsonify, send_file, current_app
import os
from werkzeug.utils import secure_filename
from pathlib import Path
import uuid
from models.user import User
from models.mentor_invitation import MentorInvitation
from models.mentor_message import MentorMessage
from config.database import db
from controllers.auth_controller import token_required
from functools import wraps
from datetime import datetime
from sqlalchemy import func

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

@mentor_bp.route('/invitations', methods=['GET'])
# @mentor_required
def list_invitations():
    """Lista invitaciones dirigidas al mentor, opcionalmente por estado"""
    try:
        mentor_id = request.args.get('mentor_id')
        status = request.args.get('status', 'pending')
        if not mentor_id:
            return jsonify({'error': 'ID de mentor requerido'}), 400
        mentor = User.query.get(mentor_id)
        if not mentor or mentor.role != 'mentor':
            return jsonify({'error': 'Mentor no válido'}), 403

        query = MentorInvitation.query.filter_by(mentor_id=mentor.id)
        if status:
            query = query.filter_by(status=status)
        invitations = query.order_by(MentorInvitation.created_at.desc()).all()
        return jsonify({
            'mentor': {'id': mentor.id, 'username': mentor.username, 'email': mentor.email},
            'invitations': [inv.to_dict() for inv in invitations],
            'total': len(invitations)
        }), 200
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@mentor_bp.route('/invitations/<int:invitation_id>/respond', methods=['POST'])
# @mentor_required
def respond_invitation(invitation_id):
    """Mentor acepta o rechaza una invitación"""
    try:
        data = request.get_json() or {}
        mentor_id = data.get('mentor_id')
        action = (data.get('action') or '').lower()
        if not mentor_id:
            return jsonify({'error': 'ID de mentor requerido'}), 400
        if action not in ['accept', 'reject']:
            return jsonify({'error': "Acción inválida. Use 'accept' o 'reject'"}), 400

        mentor = User.query.get(mentor_id)
        if not mentor or mentor.role != 'mentor':
            return jsonify({'error': 'Mentor no válido'}), 403

        invitation = MentorInvitation.query.get(invitation_id)
        if not invitation or invitation.mentor_id != mentor.id:
            return jsonify({'error': 'Invitación no encontrada'}), 404
        if invitation.status != 'pending':
            return jsonify({'error': 'La invitación ya fue respondida'}), 400

        if action == 'accept':
            user = User.query.get(invitation.user_id)
            if not user:
                return jsonify({'error': 'Usuario no encontrado'}), 404
            if user.mentor_id:
                return jsonify({'error': 'El usuario ya tiene mentor asignado'}), 400
            user.mentor_id = mentor.id
            invitation.status = 'accepted'
            invitation.responded_at = datetime.utcnow()
            db.session.commit()
            return jsonify({'message': 'Invitación aceptada. Usuario asignado.', 'invitation': invitation.to_dict()}), 200

        # reject
        invitation.status = 'rejected'
        invitation.responded_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'message': 'Invitación rechazada', 'invitation': invitation.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@mentor_bp.route('/messages', methods=['GET'])
# @mentor_required
def list_messages_for_mentor():
    """Lista mensajes entre el mentor y un usuario específico"""
    try:
        mentor_id = request.args.get('mentor_id')
        user_id = request.args.get('user_id')
        if not mentor_id or not user_id:
            return jsonify({'error': 'mentor_id y user_id son requeridos'}), 400
        mentor = User.query.get(int(mentor_id))
        if not mentor or mentor.role != 'mentor':
            return jsonify({'error': 'Mentor no válido'}), 403
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        msgs = (MentorMessage.query
                .filter_by(user_id=user.id, mentor_id=mentor.id)
                .order_by(MentorMessage.created_at.asc())
                .all())
        return jsonify({'messages': [m.to_dict() for m in msgs], 'total': len(msgs)}), 200
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

def allowed_file(filename):
    """Verifica si el archivo está permitido"""
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx', 'odt'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@mentor_bp.route('/messages', methods=['POST'])
# @mentor_required
def send_message_as_mentor():
    """Envía mensaje del mentor al usuario (puede incluir archivo)"""
    try:
        mentor_id = request.form.get('mentor_id')
        user_id = request.form.get('user_id')
        content = (request.form.get('content') or '').strip()
        file = request.files.get('file')
        
        if not mentor_id or not user_id:
            return jsonify({'error': 'mentor_id y user_id son requeridos'}), 400
        
        # Debe haber contenido o archivo
        if not content and not file:
            return jsonify({'error': 'Debes enviar un mensaje de texto o un archivo'}), 400
        
        mentor = User.query.get(int(mentor_id))
        if not mentor or mentor.role != 'mentor':
            return jsonify({'error': 'Mentor no válido'}), 403
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        if user.mentor_id != mentor.id:
            return jsonify({'error': 'El usuario no está asignado a este mentor'}), 403
        
        # Procesar archivo si existe
        file_name = None
        file_path = None
        file_type = None
        file_size = None
        
        if file and file.filename:
            if not allowed_file(file.filename):
                return jsonify({'error': 'Tipo de archivo no permitido. Solo se permiten: txt, pdf, doc, docx, odt'}), 400
            
            # Generar nombre único para el archivo
            original_filename = secure_filename(file.filename)
            file_ext = original_filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
            
            # Crear subdirectorio por mensaje si es necesario
            upload_folder = Path(current_app.config['UPLOAD_FOLDER'])
            file_path_obj = upload_folder / unique_filename
            
            # Guardar archivo
            file.save(str(file_path_obj))
            
            file_name = original_filename
            # Guardar ruta relativa desde BASE_DIR para poder reconstruirla
            file_path = f"uploads/messages/{unique_filename}"
            file_type = file.content_type or f'application/{file_ext}'
            file_size = file_path_obj.stat().st_size
        
        msg = MentorMessage(
            user_id=user.id,
            mentor_id=mentor.id,
            sender_id=mentor.id,
            content=content if content else None,
            file_name=file_name,
            file_path=file_path,
            file_type=file_type,
            file_size=file_size
        )
        db.session.add(msg)
        db.session.commit()
        return jsonify({'message': 'Enviado', 'data': msg.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        # Limpiar archivo si hubo error
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@mentor_bp.route('/messages/files/<int:message_id>', methods=['GET'])
def download_file_mentor(message_id):
    """Descarga un archivo adjunto de un mensaje (para mentores)"""
    try:
        msg = MentorMessage.query.get(message_id)
        if not msg:
            return jsonify({'error': 'Mensaje no encontrado'}), 404
        
        if not msg.file_path:
            return jsonify({'error': 'Este mensaje no tiene archivo adjunto'}), 404
        
        # Verificar que el mentor tiene acceso a este mensaje
        mentor_id = request.args.get('mentor_id')
        if mentor_id:
            mentor = User.query.get(int(mentor_id))
            if mentor and mentor.role == 'mentor' and msg.mentor_id == mentor.id:
                # Construir ruta completa al archivo
                # msg.file_path se guarda como "uploads/messages/nombre_archivo.extension"
                upload_folder = Path(current_app.config['UPLOAD_FOLDER'])
                # Si la ruta es relativa (empieza con "uploads/"), construir desde BASE_DIR
                if msg.file_path.startswith('uploads/'):
                    base_dir = Path(current_app.root_path).parent
                    file_path_full = base_dir / msg.file_path
                else:
                    # Si es solo el nombre del archivo, buscarlo en upload_folder
                    file_path_full = upload_folder / msg.file_path.split('/')[-1].split('\\')[-1]
                
                if not file_path_full.exists():
                    return jsonify({'error': 'Archivo no encontrado en el servidor'}), 404
                
                return send_file(
                    str(file_path_full),
                    as_attachment=True,
                    download_name=msg.file_name or 'archivo',
                    mimetype=msg.file_type or 'application/octet-stream'
                )
        
        return jsonify({'error': 'No tienes permiso para acceder a este archivo'}), 403
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@mentor_bp.route('/conversations', methods=['GET'])
# @mentor_required
def list_conversations():
    """Lista emprendedoras asignadas al mentor con conteo de no leídos"""
    try:
        mentor_id = request.args.get('mentor_id')
        if not mentor_id:
            return jsonify({'error': 'ID de mentor requerido'}), 400
        mentor = User.query.get(int(mentor_id))
        if not mentor or mentor.role != 'mentor':
            return jsonify({'error': 'Mentor no válido'}), 403

        # Emprendedoras asignadas
        users = User.query.filter_by(mentor_id=mentor.id, role='user').all()
        user_ids = [u.id for u in users]
        if not user_ids:
            return jsonify({'conversations': [], 'total': 0}), 200

        # No leídos: mensajes enviados por la emprendedora (sender_id=user.id) hacia el mentor, is_read = false
        unread_counts = dict(
            db.session.query(MentorMessage.user_id, func.count(MentorMessage.id))
            .filter(
                MentorMessage.mentor_id == mentor.id,
                MentorMessage.user_id.in_(user_ids),
                MentorMessage.sender_id.in_(user_ids),
                MentorMessage.is_read.is_(False),
            )
            .group_by(MentorMessage.user_id)
            .all()
        )

        conversations = []
        for u in users:
            conversations.append({
                'user': u.to_dict(include_mentor=False),
                'unread_count': int(unread_counts.get(u.id, 0))
            })

        return jsonify({'conversations': conversations, 'total': len(conversations)}), 200
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@mentor_bp.route('/messages/read', methods=['POST'])
# @mentor_required
def mark_messages_read():
    """Marca como leídos los mensajes de una emprendedora hacia el mentor"""
    data = request.get_json() or {}
    mentor_id = data.get('mentor_id')
    user_id = data.get('user_id')
    if not mentor_id or not user_id:
        return jsonify({'error': 'mentor_id y user_id son requeridos'}), 400
    try:
        mentor = User.query.get(int(mentor_id))
        if not mentor or mentor.role != 'mentor':
            return jsonify({'error': 'Mentor no válido'}), 403
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        if user.mentor_id != mentor.id:
            return jsonify({'error': 'El usuario no está asignado a este mentor'}), 403
        # Marcar no leídos como leídos (mensajes de la usuaria)
        updated = (MentorMessage.query
                   .filter_by(mentor_id=mentor.id, user_id=user.id)
                   .filter(MentorMessage.sender_id == user.id, MentorMessage.is_read.is_(False))
                   .update({MentorMessage.is_read: True}, synchronize_session=False))
        db.session.commit()
        return jsonify({'message': 'Mensajes marcados como leídos', 'updated': int(updated)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

