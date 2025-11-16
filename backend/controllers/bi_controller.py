from models.user import User
from config.database import db
from flask import jsonify
from sqlalchemy import func, extract
from datetime import datetime, timedelta

class BIController:
    """Controlador para Business Intelligence y estadísticas"""
    
    @staticmethod
    def get_statistics():
        """Obtiene estadísticas generales del sistema"""
        try:
            # Estadísticas básicas
            total_users = User.query.count()
            total_admins = User.query.filter_by(role='admin').count()
            total_mentors = User.query.filter_by(role='mentor').count()
            total_users_role = User.query.filter_by(role='user').count()
            
            # Usuarios con mentor asignado
            users_with_mentor = User.query.filter(User.role == 'user', User.mentor_id.isnot(None)).count()
            users_without_mentor = total_users_role - users_with_mentor
            
            # Estadísticas por mentor
            mentors_with_users = User.query.filter_by(role='mentor').all()
            mentor_breakdown = []
            for mentor in mentors_with_users:
                assigned_count = len(mentor.assigned_users)
                if assigned_count > 0:
                    mentor_breakdown.append({
                        'mentor': mentor.username,
                        'count': assigned_count
                    })
            
            # Usuarios creados por mes (últimos 6 meses)
            six_months_ago = datetime.utcnow() - timedelta(days=180)
            monthly_users_raw = db.session.query(
                extract('year', User.created_at).label('year'),
                extract('month', User.created_at).label('month'),
                func.count(User.id).label('count')
            ).filter(
                User.created_at >= six_months_ago
            ).group_by(
                extract('year', User.created_at),
                extract('month', User.created_at)
            ).order_by(extract('year', User.created_at), extract('month', User.created_at)).all()
            
            monthly_breakdown = [
                {'month': f"{int(year)}-{int(month):02d}", 'count': count}
                for year, month, count in monthly_users_raw
            ]
            
            # Usuarios por rol
            role_distribution = [
                {'role': 'admin', 'count': total_admins, 'color': '#c33'},
                {'role': 'mentor', 'count': total_mentors, 'color': '#856404'},
                {'role': 'user', 'count': total_users_role, 'color': '#1976d2'}
            ]
            
            # Usuarios con/sin mentor
            mentor_assignment = [
                {'status': 'Con mentor', 'count': users_with_mentor, 'color': '#28a745'},
                {'status': 'Sin mentor', 'count': users_without_mentor, 'color': '#dc3545'}
            ]
            
            return {
                'overview': {
                    'total_users': total_users,
                    'total_admins': total_admins,
                    'total_mentors': total_mentors,
                    'total_users_role': total_users_role,
                    'users_with_mentor': users_with_mentor,
                    'users_without_mentor': users_without_mentor
                },
                'role_distribution': role_distribution,
                'mentor_assignment': mentor_assignment,
                'mentor_breakdown': mentor_breakdown,
                'monthly_users': monthly_breakdown
            }, 200
        except Exception as e:
            return {'error': f'Error al obtener estadísticas: {str(e)}'}, 500
    
    @staticmethod
    def get_mentor_performance():
        """Obtiene métricas de rendimiento de mentores"""
        try:
            mentors = User.query.filter_by(role='mentor').all()
            
            performance_data = []
            for mentor in mentors:
                assigned_count = len(mentor.assigned_users)
                performance_data.append({
                    'mentor_id': mentor.id,
                    'mentor_name': mentor.username,
                    'assigned_users': assigned_count,
                    'email': mentor.email
                })
            
            # Ordenar por cantidad de usuarios asignados
            performance_data.sort(key=lambda x: x['assigned_users'], reverse=True)
            
            return {
                'mentors': performance_data,
                'total_mentors': len(performance_data)
            }, 200
        except Exception as e:
            return {'error': f'Error al obtener rendimiento de mentores: {str(e)}'}, 500

