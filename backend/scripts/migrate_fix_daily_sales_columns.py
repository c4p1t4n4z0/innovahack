"""
Corrige la estructura de la tabla daily_sales eliminando columnas que no están en el modelo
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app import app
from config.database import db
from sqlalchemy import text

def column_exists(conn, table, column):
    res = conn.execute(
        text("SELECT column_name FROM information_schema.columns WHERE table_name=:t AND column_name=:c"),
        {"t": table, "c": column}
    )
    return res.fetchone() is not None

def migrate():
    with app.app_context():
        with db.engine.connect() as conn:
            # Lista de columnas que NO deberían estar en daily_sales según el modelo
            columns_to_remove = [
                'total_revenue',
                'total_variable_costs',
                'gross_profit',
                'revenue',
                'net_profit',
                'profit_margin'
            ]
            
            for column_name in columns_to_remove:
                if column_exists(conn, "daily_sales", column_name):
                    print(f"[INFO] Eliminando columna {column_name} de daily_sales...")
                    try:
                        conn.execute(text(f"ALTER TABLE daily_sales DROP COLUMN IF EXISTS {column_name}"))
                        conn.commit()
                        print(f"[OK] Columna {column_name} eliminada")
                    except Exception as e:
                        print(f"[ERROR] Error al eliminar columna {column_name}: {str(e)}")
                        conn.rollback()
                else:
                    print(f"[INFO] La columna {column_name} no existe en daily_sales")
            
            # Verificar que las columnas correctas existen
            required_columns = [
                'id', 'user_id', 'sale_date', 'product_name', 'units_sold',
                'price_per_unit', 'variable_cost_per_unit', 'created_at', 'updated_at'
            ]
            
            print("\n[INFO] Verificando columnas requeridas...")
            for col in required_columns:
                if column_exists(conn, "daily_sales", col):
                    print(f"[OK] Columna {col} existe")
                else:
                    print(f"[WARNING] Columna {col} no existe")
            
            print("\n[OK] Migración completada")

if __name__ == '__main__':
    print("=" * 50)
    print("Migracion: Corregir estructura de daily_sales")
    print("=" * 50)
    migrate()
    print("=" * 50)

