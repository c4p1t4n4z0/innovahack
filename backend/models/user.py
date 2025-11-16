from config.database import db, bcrypt
from datetime import datetime

class User(db.Model):
    """Modelo de Usuario"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user', nullable=False)  # 'admin', 'mentor' o 'user'
    mentor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Mentor asignado
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    mentor = db.relationship('User', remote_side=[id], backref='assigned_users', foreign_keys=[mentor_id])
    
    def set_password(self, password):
        """Establece la contraseña hasheada"""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def __init__(self, username, email, password, role='user', mentor_id=None):
        self.username = username
        self.email = email
        self.role = role
        self.mentor_id = mentor_id
        self.set_password(password)
    
    def check_password(self, password):
        """Verifica si la contraseña es correcta"""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_mentor=True):
        """Convierte el usuario a diccionario"""
        mentor_dict = None
        if include_mentor and self.mentor:
            try:
                mentor_dict = {
                    'id': self.mentor.id,
                    'username': self.mentor.username,
                    'email': self.mentor.email,
                    'role': self.mentor.role
                }
            except:
                mentor_dict = None
        
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'mentor_id': self.mentor_id,
            'mentor': mentor_dict,
            'assigned_users_count': len(self.assigned_users) if self.is_mentor() else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def is_admin(self):
        """Verifica si el usuario es administrador"""
        return self.role == 'admin'
    
    def is_mentor(self):
        """Verifica si el usuario es mentor"""
        return self.role == 'mentor'

