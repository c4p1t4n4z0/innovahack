from config.database import db
from datetime import datetime

class MentorMessage(db.Model):
    """Mensajes entre usuario y su mentora"""
    __tablename__ = 'mentor_messages'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # usuario (rol user)
    mentor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # mentora (rol mentor)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'mentor_id': self.mentor_id,
            'sender_id': self.sender_id,
            'content': self.content,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


