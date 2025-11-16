from config.database import db
from datetime import datetime

class MentorInvitation(db.Model):
    """Invitaciones de usuario a mentor (un mentor puede aceptar/rechazar)"""
    __tablename__ = 'mentor_invitations'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    mentor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending', nullable=False)  # pending, accepted, rejected
    message = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    responded_at = db.Column(db.DateTime, nullable=True)

    # Relaciones
    user = db.relationship('User', foreign_keys=[user_id])
    mentor = db.relationship('User', foreign_keys=[mentor_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                # incluir info de emprendimiento para que el mentor decida
                'business': {
                    'name': getattr(self.user, 'business_name', None),
                    'category': getattr(self.user, 'business_category', None),
                    'description': getattr(self.user, 'business_description', None),
                }
            } if self.user else None,
            'mentor': {
                'id': self.mentor.id,
                'username': self.mentor.username,
                'email': self.mentor.email
            } if self.mentor else None,
            'status': self.status,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
        }


