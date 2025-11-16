from config.database import db
from datetime import datetime

class DailySale(db.Model):
    """Modelo de Venta Diaria"""
    __tablename__ = 'daily_sales'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sale_date = db.Column(db.Date, nullable=False)
    product_name = db.Column(db.String(150), nullable=True)  # Opcional si hay múltiples productos
    units_sold = db.Column(db.Integer, nullable=False, default=0)
    price_per_unit = db.Column(db.Numeric(10, 2), nullable=False)
    variable_cost_per_unit = db.Column(db.Numeric(10, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Índices para mejorar consultas
    __table_args__ = (
        db.Index('idx_user_date', 'user_id', 'sale_date'),
    )
    
    def to_dict(self):
        """Convierte la venta diaria a diccionario"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'sale_date': self.sale_date.isoformat() if self.sale_date else None,
            'product_name': self.product_name,
            'units_sold': int(self.units_sold) if self.units_sold else 0,
            'price_per_unit': float(self.price_per_unit) if self.price_per_unit else 0.0,
            'variable_cost_per_unit': float(self.variable_cost_per_unit) if self.variable_cost_per_unit else 0.0,
            'revenue': float(self.units_sold * self.price_per_unit) if self.units_sold and self.price_per_unit else 0.0,
            'total_variable_costs': float(self.units_sold * self.variable_cost_per_unit) if self.units_sold and self.variable_cost_per_unit else 0.0,
            'gross_profit': float((self.units_sold * self.price_per_unit) - (self.units_sold * self.variable_cost_per_unit)) if self.units_sold and self.price_per_unit and self.variable_cost_per_unit else 0.0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class MonthlyParameters(db.Model):
    """Modelo de Parámetros Mensuales del Usuario"""
    __tablename__ = 'monthly_parameters'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    target_monthly_sales = db.Column(db.Integer, nullable=False, default=0)  # Meta de ventas en unidades
    fixed_costs_monthly = db.Column(db.Numeric(10, 2), nullable=False, default=0.0)  # Costos fijos mensuales
    loan_monthly_payment = db.Column(db.Numeric(10, 2), nullable=True, default=0.0)  # Cuota mensual del crédito
    working_days_per_month = db.Column(db.Integer, nullable=False, default=30)  # Días hábiles del mes
    default_price_per_unit = db.Column(db.Numeric(10, 2), nullable=True)  # Precio por defecto
    default_variable_cost_per_unit = db.Column(db.Numeric(10, 2), nullable=True)  # Costo variable por defecto
    month_year = db.Column(db.String(7), nullable=False)  # Formato: YYYY-MM para identificar el mes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convierte los parámetros mensuales a diccionario"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'target_monthly_sales': int(self.target_monthly_sales) if self.target_monthly_sales else 0,
            'fixed_costs_monthly': float(self.fixed_costs_monthly) if self.fixed_costs_monthly else 0.0,
            'loan_monthly_payment': float(self.loan_monthly_payment) if self.loan_monthly_payment else 0.0,
            'working_days_per_month': int(self.working_days_per_month) if self.working_days_per_month else 30,
            'default_price_per_unit': float(self.default_price_per_unit) if self.default_price_per_unit else None,
            'default_variable_cost_per_unit': float(self.default_variable_cost_per_unit) if self.default_variable_cost_per_unit else None,
            'month_year': self.month_year,
            'daily_target_units': int(self.target_monthly_sales / self.working_days_per_month) if self.working_days_per_month > 0 else 0,
            'daily_fixed_costs': float(self.fixed_costs_monthly / self.working_days_per_month) if self.working_days_per_month > 0 else 0.0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

