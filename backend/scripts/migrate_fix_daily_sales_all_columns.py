"""
Corrige la estructura de la tabla daily_sales eliminando TODAS las columnas que no están en el modelo
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app import app
from config.database import db
from sqlalchemy import text

def get_all_columns(conn, table):
    """Obtiene todas las columnas de una tabla"""
    res = conn.execute(
        text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = :t
            ORDER BY ordinal_position
        """),
        {"t": table}
    )
    return [row[0] for row in res.fetchall()]

def column_exists(conn, table, column):
    res = conn.execute(
        text("SELECT column_name FROM information_schema.columns WHERE table_name=:t AND column_name=:c"),
        {"t": table, "c": column}
    )
    return res.fetchone() is not None

def migrate():
    with app.app_context():
        with db.engine.connect() as conn:
            # Columnas que DEBEN estar según el modelo
            required_columns = {
                'id', 'user_id', 'sale_date', 'product_name', 'units_sold',
                'price_per_unit', 'variable_cost_per_unit', 'created_at', 'updated_at'
            }
            
            # Obtener todas las columnas actuales de la tabla
            all_columns = get_all_columns(conn, "daily_sales")
            
            print(f"[INFO] Columnas actuales en daily_sales: {', '.join(all_columns)}")
            
            # Identificar columnas a eliminar (las que no están en required_columns)
            columns_to_remove = [col for col in all_columns if col not in required_columns]
            
            if columns_to_remove:
                print(f"\n[INFO] Columnas a eliminar: {', '.join(columns_to_remove)}")
                
                for column_name in columns_to_remove:
                    if column_exists(conn, "daily_sales", column_name):
                        print(f"[INFO] Eliminando columna {column_name} de daily_sales...")
                        try:
                            conn.execute(text(f'ALTER TABLE daily_sales DROP COLUMN IF EXISTS "{column_name}"'))
                            conn.commit()
                            print(f"[OK] Columna {column_name} eliminada")
                        except Exception as e:
                            print(f"[ERROR] Error al eliminar columna {column_name}: {str(e)}")
                            conn.rollback()
                            # Intentar sin IF EXISTS para ver el error completo
                            try:
                                conn.execute(text(f'ALTER TABLE daily_sales DROP COLUMN "{column_name}"'))
                                conn.commit()
                                print(f"[OK] Columna {column_name} eliminada (segundo intento)")
                            except Exception as e2:
                                print(f"[ERROR] Error definitivo al eliminar {column_name}: {str(e2)}")
                                conn.rollback()
            else:
                print("[INFO] No hay columnas adicionales para eliminar")
            
            # Verificar columnas finales
            final_columns = get_all_columns(conn, "daily_sales")
            print(f"\n[INFO] Columnas finales en daily_sales: {', '.join(final_columns)}")
            
            # Verificar que todas las columnas requeridas existen
            missing_columns = required_columns - set(final_columns)
            if missing_columns:
                print(f"[WARNING] Faltan columnas requeridas: {', '.join(missing_columns)}")
            else:
                print("[OK] Todas las columnas requeridas están presentes")
            
            print("\n[OK] Migración completada")

if __name__ == '__main__':
    print("=" * 50)
    print("Migracion: Corregir TODA la estructura de daily_sales")
    print("=" * 50)
    migrate()
    print("=" * 50)

