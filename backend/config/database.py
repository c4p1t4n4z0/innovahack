from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import time

db = SQLAlchemy()
bcrypt = Bcrypt()

def init_db(app):
    """Inicializa la base de datos"""
    db.init_app(app)
    bcrypt.init_app(app)
    
    # Intentar conectar con retry en caso de que PostgreSQL esté aún iniciando
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            with app.app_context():
                # Intentar una conexión simple primero
                db.engine.connect()
                print("[OK] Conexion a PostgreSQL establecida")
                
                # Crear las tablas
                db.create_all()
                print("[OK] Tablas creadas correctamente")
                break
        except Exception as e:
            error_str = str(e)
            if attempt < max_retries - 1:
                print(f"[WARNING] Intento {attempt + 1}/{max_retries} fallo. Reintentando en {retry_delay} segundos...")
                print(f"   Error: {error_str[:200]}")
                time.sleep(retry_delay)
            else:
                print(f"[ERROR] Error despues de {max_retries} intentos:")
                print(f"   Error completo: {error_str}")
                raise

