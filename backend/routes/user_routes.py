"""
Rutas para gestión del propio perfil de usuario (rol 'user')
"""
from flask import Blueprint, request, jsonify, send_file, current_app
from controllers.user_controller import UserController
from models.user import User
from models.mentor_message import MentorMessage
from config.database import db
from sqlalchemy import func
import os
from werkzeug.utils import secure_filename
from pathlib import Path
from datetime import datetime
import uuid

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

def allowed_file(filename):
    """Verifica si el archivo está permitido"""
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx', 'odt'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@user_bp.route('/messages', methods=['POST'])
def send_message():
    """Envía un mensaje del usuario a su mentora (puede incluir archivo)"""
    try:
        user_id = request.form.get('user_id')
        content = (request.form.get('content') or '').strip()
        file = request.files.get('file')
        
        if not user_id:
            return jsonify({'error': 'user_id es requerido'}), 400
        
        # Debe haber contenido o archivo
        if not content and not file:
            return jsonify({'error': 'Debes enviar un mensaje de texto o un archivo'}), 400
        
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        if not user.mentor_id:
            return jsonify({'error': 'Aún no tienes mentora asignada'}), 400
        
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
        
        # Crear mensaje
        msg = MentorMessage(
            user_id=user.id,
            mentor_id=user.mentor_id,
            sender_id=user.id,
            content=content if content else None,
            file_name=file_name,
            file_path=file_path,
            file_type=file_type,
            file_size=file_size,
            is_read=False  # no leído por la mentora
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

@user_bp.route('/messages/files/<int:message_id>', methods=['GET'])
def download_file(message_id):
    """Descarga un archivo adjunto de un mensaje"""
    try:
        msg = MentorMessage.query.get(message_id)
        if not msg:
            return jsonify({'error': 'Mensaje no encontrado'}), 404
        
        if not msg.file_path:
            return jsonify({'error': 'Este mensaje no tiene archivo adjunto'}), 404
        
        # Verificar que el usuario tiene acceso a este mensaje
        user_id = request.args.get('user_id')
        if user_id:
            user = User.query.get(int(user_id))
            if user and (msg.user_id == user.id or msg.mentor_id == user.mentor_id):
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


