"""
Crea las tablas daily_sales y monthly_parameters si no existen.
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app import app
from config.database import db
from models.daily_sale import DailySale, MonthlyParameters

def migrate():
    with app.app_context():
        try:
            # Crear las tablas si no existen
            db.create_all()
            print("[OK] Tablas daily_sales y monthly_parameters creadas/verificadas correctamente")
        except Exception as e:
            print(f"[ERROR] Error al crear tablas: {str(e)}")
            raise

if __name__ == '__main__':
    print("=" * 50)
    print("Migracion: Crear tablas de ventas diarias")
    print("=" * 50)
    migrate()
    print("=" * 50)

