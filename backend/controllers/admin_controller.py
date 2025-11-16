from models.user import User
from config.database import db
from flask import jsonify
import re

class AdminController:
    """Controlador para operaciones de administración"""
    
    @staticmethod
    def get_all_users():
        """Obtiene todos los usuarios"""
        try:
            users = User.query.all()
            return {'users': [user.to_dict() for user in users], 'total': len(users)}, 200
        except Exception as e:
            return {'error': f'Error al obtener usuarios: {str(e)}'}, 500
    
    @staticmethod
    def get_user_by_id(user_id):
        """Obtiene un usuario por ID"""
        try:
            user = User.query.get(user_id)
            if not user:
                return {'error': 'Usuario no encontrado'}, 404
            return {'user': user.to_dict()}, 200
        except Exception as e:
            return {'error': f'Error al obtener usuario: {str(e)}'}, 500
    
    @staticmethod
    def create_user(username, email, password, role='user'):
        """Crea un nuevo usuario"""
        # Validaciones
        if not username or not email or not password:
            return {'error': 'Todos los campos son obligatorios'}, 400
        
        if len(password) < 6:
            return {'error': 'La contraseña debe tener al menos 6 caracteres'}, 400
        
        # Validar formato de email
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return {'error': 'Email inválido'}, 400
        
        # Validar role
        if role not in ['admin', 'mentor', 'user']:
            role = 'user'
        
        # Verificar si el usuario ya existe
        if User.query.filter_by(username=username).first():
            return {'error': 'El nombre de usuario ya está en uso'}, 400
        
        if User.query.filter_by(email=email).first():
            return {'error': 'El email ya está registrado'}, 400
        
        try:
            new_user = User(username=username, email=email, password=password, role=role)
            db.session.add(new_user)
            db.session.commit()
            return {'message': 'Usuario creado correctamente', 'user': new_user.to_dict()}, 201
        except Exception as e:
            db.session.rollback()
            return {'error': f'Error al crear usuario: {str(e)}'}, 500
    
    @staticmethod
    def update_user(user_id, username=None, email=None, password=None, role=None):
        """Actualiza un usuario"""
        try:
            user = User.query.get(user_id)
            if not user:
                return {'error': 'Usuario no encontrado'}, 404
            
            # Actualizar campos si se proporcionan
            if username and username != user.username:
                # Verificar si el nuevo username ya existe
                if User.query.filter(User.username == username, User.id != user_id).first():
                    return {'error': 'El nombre de usuario ya está en uso'}, 400
                user.username = username
            
            if email and email != user.email:
                # Validar formato de email
                email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                if not re.match(email_regex, email):
                    return {'error': 'Email inválido'}, 400
                # Verificar si el nuevo email ya existe
                if User.query.filter(User.email == email, User.id != user_id).first():
                    return {'error': 'El email ya está registrado'}, 400
                user.email = email
            
            if password:
                if len(password) < 6:
                    return {'error': 'La contraseña debe tener al menos 6 caracteres'}, 400
                user.set_password(password)
            
            if role and role in ['admin', 'mentor', 'user']:
                user.role = role
                # Si cambia a user, remover mentor_id
                if role == 'user':
                    user.mentor_id = None
            
            db.session.commit()
            return {'message': 'Usuario actualizado correctamente', 'user': user.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            return {'error': f'Error al actualizar usuario: {str(e)}'}, 500
    
    @staticmethod
    def delete_user(user_id):
        """Elimina un usuario"""
        try:
            user = User.query.get(user_id)
            if not user:
                return {'error': 'Usuario no encontrado'}, 404
            
            username = user.username
            db.session.delete(user)
            db.session.commit()
            return {'message': f'Usuario {username} eliminado correctamente'}, 200
        except Exception as e:
            db.session.rollback()
            return {'error': f'Error al eliminar usuario: {str(e)}'}, 500
    
    @staticmethod
    def assign_user_to_mentor(user_id, mentor_id):
        """Asigna un usuario a un mentor"""
        try:
            user = User.query.get(user_id)
            if not user:
                return {'error': 'Usuario no encontrado'}, 404
            
            if user.role == 'admin':
                return {'error': 'No se puede asignar un administrador a un mentor'}, 400
            
            if user.role == 'mentor':
                return {'error': 'No se puede asignar un mentor a otro mentor'}, 400
            
            if mentor_id:
                mentor = User.query.get(mentor_id)
                if not mentor:
                    return {'error': 'Mentor no encontrado'}, 404
                
                if mentor.role != 'mentor':
                    return {'error': 'El usuario seleccionado no es un mentor'}, 400
            
            user.mentor_id = mentor_id
            db.session.commit()
            
            mentor_name = mentor.username if mentor_id else None
            return {
                'message': f'Usuario asignado correctamente al mentor {mentor_name}' if mentor_id else 'Asignación de mentor removida',
                'user': user.to_dict()
            }, 200
        except Exception as e:
            db.session.rollback()
            return {'error': f'Error al asignar usuario: {str(e)}'}, 500
    
    @staticmethod
    def get_mentor_users(mentor_id):
        """Obtiene los usuarios asignados a un mentor"""
        try:
            mentor = User.query.get(mentor_id)
            if not mentor:
                return {'error': 'Mentor no encontrado'}, 404
            
            if mentor.role != 'mentor':
                return {'error': 'El usuario no es un mentor'}, 400
            
            assigned_users = User.query.filter_by(mentor_id=mentor_id).all()
            return {
                'mentor': mentor.to_dict(),
                'users': [user.to_dict() for user in assigned_users],
                'total': len(assigned_users)
            }, 200
        except Exception as e:
            return {'error': f'Error al obtener usuarios del mentor: {str(e)}'}, 500
    
    @staticmethod
    def get_all_mentors():
        """Obtiene todos los mentores"""
        try:
            mentors = User.query.filter_by(role='mentor').all()
            return {'mentors': [mentor.to_dict() for mentor in mentors], 'total': len(mentors)}, 200
        except Exception as e:
            return {'error': f'Error al obtener mentores: {str(e)}'}, 500
