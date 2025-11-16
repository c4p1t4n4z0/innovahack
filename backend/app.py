from flask import Flask
from flask_cors import CORS
from config.database import init_db
from routes.auth_routes import auth_bp
from dotenv import load_dotenv
import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()
# Obtener la ruta del directorio actual
BASE_DIR = Path(__file__).resolve().parent

# Cargar variables de entorno desde archivo .env en el directorio backend
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'tu-clave-secreta-aqui-cambiar-en-produccion')

# Configuración de base de datos desde variables de entorno
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres123')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5433')  # Cambiar a 5433 si Docker usa ese puerto
DB_NAME = os.getenv('DB_NAME', 'proyecto_db')

# En Windows con Docker Desktop, mantener localhost ya que Docker mapea correctamente
# No cambiar a 127.0.0.1 si ya es localhost
if DB_HOST == 'localhost' and os.name == 'nt':
    # En Windows, Docker Desktop mapea mejor con localhost
    # Pero intentemos primero con localhost y luego con 127.0.0.1 si falla
    pass

# Construir URI de conexión con parámetros adicionales para Docker en Windows
# Agregar parámetros para evitar problemas de conexión
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?connect_timeout=10'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Nota: SQLALCHEMY_ENGINE_OPTIONS se configura en database.py si es necesario

# Mensaje de depuración (solo mostrar sin password por seguridad)
print(f"[INFO] Conectando a PostgreSQL: postgresql://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")

CORS(app, origins=['http://localhost:3000'], supports_credentials=True)

# Inicializar base de datos con manejo de errores
try:
    init_db(app)
    print("[OK] Base de datos inicializada correctamente")
except Exception as e:
    error_msg = str(e)
    print(f"[ERROR] Error al inicializar la base de datos:")
    print(f"   Tipo: {type(e).__name__}")
    print(f"   Mensaje: {error_msg}")
    
    # Verificar si es un error de conexión
    if "could not connect" in error_msg.lower() or "connection refused" in error_msg.lower():
        print("\n[INFO] Posibles soluciones:")
        print("   1. Verifica que PostgreSQL esté corriendo: docker ps")
        print("   2. Inicia PostgreSQL si no está corriendo: docker-compose up -d")
        print("   3. Espera unos segundos después de iniciar Docker")
        print("   4. Verifica los logs: docker logs proyecto_postgres")
        print(f"   5. Prueba conectarte manualmente: psql -h localhost -U postgres -d proyecto_db")
    elif "authentication failed" in error_msg.lower():
        print("\n[INFO] Error de autenticación - Verifica las credenciales en .env")
    elif "database" in error_msg.lower() and "does not exist" in error_msg.lower():
        print("\n[INFO] La base de datos no existe - El contenedor debería crearla automáticamente")
    
    raise

# Registrar rutas
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Registrar rutas de administración
from routes.admin_routes import admin_bp
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# Registrar rutas de mentores
from routes.mentor_routes import mentor_bp
app.register_blueprint(mentor_bp, url_prefix='/api/mentor')

# Registrar rutas de usuario (perfil propio)
from routes.user_routes import user_bp
app.register_blueprint(user_bp, url_prefix='/api/user')

# Registrar rutas de IA (Gemini)
from routes.ai_routes import ai_bp
app.register_blueprint(ai_bp, url_prefix='/api')

@app.route('/')
def index():
    return {'message': 'API funcionando correctamente'}

if __name__ == '__main__':
    app.run(debug=True, port=5000)

