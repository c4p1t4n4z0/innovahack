"""Script de prueba para verificar conexion a PostgreSQL"""
import psycopg2
import sys

try:
    print("Intentando conectar a PostgreSQL...")
    print(f"Host: localhost, Port: 5432, User: postgres, DB: innovadb")
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='root',
        database='innovadb',
        connect_timeout=5
    )
    print("OK - Conexion exitosa!")
    cur = conn.cursor()
    cur.execute("SELECT version();")
    version = cur.fetchone()
    print(f"Version de PostgreSQL: {version[0]}")
    cur.close()
    conn.close()
except psycopg2.OperationalError as e:
    print(f"ERROR de conexion: {type(e).__name__}")
    print(f"Pgerror: {e.pgerror}")
    print(f"Pgcode: {e.pgcode}")
    print(f"Representacion: {repr(e)}")
    print(f"Args: {e.args}")
    if len(e.args) > 0:
        print(f"Primer arg: {repr(e.args[0])}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"ERROR inesperado: {type(e).__name__}")
    print(f"Mensaje: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

