from config.database import db, bcrypt
from datetime import datetime

class User(db.Model):
    """Modelo de Usuario"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user', nullable=False)  # 'admin' o 'user'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        """Establece la contraseña hasheada"""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def __init__(self, username, email, password, role='user'):
        self.username = username
        self.email = email
        self.role = role
        self.set_password(password)
    
    def check_password(self, password):
        """Verifica si la contraseña es correcta"""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convierte el usuario a diccionario"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def is_admin(self):
        """Verifica si el usuario es administrador"""
        return self.role == 'admin'

