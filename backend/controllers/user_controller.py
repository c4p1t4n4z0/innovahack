from models.user import User
from models.mentor_invitation import MentorInvitation
from config.database import db
import re
from datetime import datetime

class UserController:
    """Operaciones de usuario (perfil propio)"""

    @staticmethod
    def get_profile(user_id: int):
        user = User.query.get(user_id)
        if not user:
            return {'error': 'Usuario no encontrado'}, 404
        return {'user': user.to_dict()}, 200

    @staticmethod
    def update_profile(user_id: int, username=None, email=None, password=None):
        user = User.query.get(user_id)
        if not user:
            return {'error': 'Usuario no encontrado'}, 404

        # username
        if username and username != user.username:
            if User.query.filter(User.username == username, User.id != user_id).first():
                return {'error': 'El nombre de usuario ya está en uso'}, 400
            user.username = username

        # email
        if email and email != user.email:
            email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_regex, email):
                return {'error': 'Email inválido'}, 400
            if User.query.filter(User.email == email, User.id != user_id).first():
                return {'error': 'El email ya está registrado'}, 400
            user.email = email

        # password
        if password:
            if len(password) < 6:
                return {'error': 'La contraseña debe tener al menos 6 caracteres'}, 400
            user.set_password(password)

        db.session.commit()
        return {'message': 'Perfil actualizado', 'user': user.to_dict()}, 200

    @staticmethod
    def update_business(user_id: int, name=None, category=None, description=None):
        user = User.query.get(user_id)
        if not user:
            return {'error': 'Usuario no encontrado'}, 404

        if name is not None:
            user.business_name = name.strip() or None
        if category is not None:
            user.business_category = category.strip() or None
        if description is not None:
            user.business_description = description.strip() or None

        db.session.commit()
        return {
            'message': 'Emprendimiento actualizado',
            'user': user.to_dict()
        }, 200

    @staticmethod
    def request_mentor(user_id: int, mentor_id: int, message: str | None = None):
        user = User.query.get(user_id)
        if not user:
            return {'error': 'Usuario no encontrado'}, 404

        mentor = User.query.get(mentor_id)
        if not mentor or mentor.role != 'mentor':
            return {'error': 'Mentor no válido'}, 400

        # Si ya tiene mentor asignado, impedir nueva solicitud
        if user.mentor_id:
            return {'error': 'Ya tienes un mentor asignado'}, 400

        # Evitar duplicados pendientes
        existing = MentorInvitation.query.filter_by(
            user_id=user_id, mentor_id=mentor_id, status='pending'
        ).first()
        if existing:
            return {'error': 'Ya existe una invitación pendiente con este mentor'}, 400

        invitation = MentorInvitation(
            user_id=user_id,
            mentor_id=mentor_id,
            status='pending',
            message=message.strip() if message else None
        )
        db.session.add(invitation)
        db.session.commit()
        return {'message': 'Invitación enviada', 'invitation': invitation.to_dict()}, 201

    @staticmethod
    def list_my_invitations(user_id: int):
        invitations = MentorInvitation.query.filter_by(user_id=user_id).order_by(MentorInvitation.created_at.desc()).all()
        return {
            'invitations': [inv.to_dict() for inv in invitations],
            'total': len(invitations)
        }, 200

#


