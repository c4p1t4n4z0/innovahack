from flask import Blueprint, request, jsonify
from controllers.auth_controller import AuthController

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Ruta para registrar un nuevo usuario"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No se proporcionaron datos'}), 400
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')  # Por defecto 'user', solo puede cambiarse manualmente
    
    # Solo permitir registrar usuarios normales desde el endpoint público
    # Los admins se crean mediante script o endpoint protegido
    if role == 'admin':
        return jsonify({'error': 'No se puede crear un usuario administrador desde este endpoint'}), 403
    
    try:
        result, status_code = AuthController.register(username, email, password, role)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Ruta para iniciar sesión"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No se proporcionaron datos'}), 400
    
    username = data.get('username')  # Puede ser username o email
    password = data.get('password')
    
    try:
        result, status_code = AuthController.login(username, password)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Ruta para obtener el usuario actual (requiere autenticación)"""
    # Esta ruta necesitaría implementación de JWT en el futuro
    return jsonify({'message': 'Endpoint protegido - implementar JWT'}), 200

