from config.database import db
from datetime import datetime

class MentorMessage(db.Model):
    """Mensajes entre usuario y su mentora"""
    __tablename__ = 'mentor_messages'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # usuario (rol user)
    mentor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # mentora (rol mentor)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=True)  # Ahora puede ser null si hay archivo
    file_name = db.Column(db.String(255), nullable=True)  # Nombre original del archivo
    file_path = db.Column(db.String(500), nullable=True)  # Ruta donde se guardó el archivo
    file_type = db.Column(db.String(50), nullable=True)  # Tipo MIME: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain
    file_size = db.Column(db.Integer, nullable=True)  # Tamaño en bytes
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'mentor_id': self.mentor_id,
            'sender_id': self.sender_id,
            'content': self.content,
            'file_name': self.file_name,
            'file_path': self.file_path,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


