from models.daily_sale import DailySale, MonthlyParameters
from models.user import User
from config.database import db
from datetime import datetime, date, timedelta
from sqlalchemy import func, extract
from decimal import Decimal

class SalesController:
    """Controlador para gestión de ventas diarias"""

    @staticmethod
    def get_monthly_parameters(user_id: int, month_year: str = None):
        """Obtiene o crea los parámetros mensuales del usuario"""
        if not month_year:
            # Mes actual por defecto
            today = date.today()
            month_year = today.strftime('%Y-%m')
        
        params = MonthlyParameters.query.filter_by(
            user_id=user_id,
            month_year=month_year
        ).first()
        
        if not params:
            # Crear parámetros por defecto
            params = MonthlyParameters(
                user_id=user_id,
                month_year=month_year,
                target_monthly_sales=0,
                fixed_costs_monthly=0.0,
                loan_monthly_payment=0.0,
                working_days_per_month=30,
                default_price_per_unit=None,
                default_variable_cost_per_unit=None
            )
            db.session.add(params)
            db.session.commit()
        
        return {'parameters': params.to_dict()}, 200

    @staticmethod
    def update_monthly_parameters(user_id: int, month_year: str, **kwargs):
        """Actualiza los parámetros mensuales del usuario"""
        params = MonthlyParameters.query.filter_by(
            user_id=user_id,
            month_year=month_year
        ).first()
        
        if not params:
            params = MonthlyParameters(
                user_id=user_id,
                month_year=month_year
            )
            db.session.add(params)
        
        if 'target_monthly_sales' in kwargs:
            params.target_monthly_sales = int(kwargs['target_monthly_sales'])
        if 'fixed_costs_monthly' in kwargs:
            params.fixed_costs_monthly = Decimal(str(kwargs['fixed_costs_monthly']))
        if 'loan_monthly_payment' in kwargs:
            params.loan_monthly_payment = Decimal(str(kwargs['loan_monthly_payment']))
        if 'working_days_per_month' in kwargs:
            params.working_days_per_month = int(kwargs['working_days_per_month'])
        if 'default_price_per_unit' in kwargs:
            params.default_price_per_unit = Decimal(str(kwargs['default_price_per_unit'])) if kwargs['default_price_per_unit'] is not None else None
        if 'default_variable_cost_per_unit' in kwargs:
            params.default_variable_cost_per_unit = Decimal(str(kwargs['default_variable_cost_per_unit'])) if kwargs['default_variable_cost_per_unit'] is not None else None
        
        db.session.commit()
        return {'message': 'Parámetros actualizados', 'parameters': params.to_dict()}, 200

    @staticmethod
    def create_daily_sale(user_id: int, sale_date: str, units_sold: int, 
                         price_per_unit: float, variable_cost_per_unit: float,
                         product_name: str = None):
        """Crea o actualiza una venta diaria"""
        try:
            sale_date_obj = datetime.strptime(sale_date, '%Y-%m-%d').date()
        except:
            return {'error': 'Fecha inválida. Use formato YYYY-MM-DD'}, 400
        
        # Verificar si ya existe una venta para este día
        existing_sale = DailySale.query.filter_by(
            user_id=user_id,
            sale_date=sale_date_obj
        ).first()
        
        if existing_sale:
            # Actualizar venta existente
            existing_sale.units_sold = int(units_sold)
            existing_sale.price_per_unit = Decimal(str(price_per_unit))
            existing_sale.variable_cost_per_unit = Decimal(str(variable_cost_per_unit))
            if product_name is not None:
                existing_sale.product_name = product_name
            existing_sale.updated_at = datetime.utcnow()
            db.session.commit()
            return {'message': 'Venta actualizada', 'sale': existing_sale.to_dict()}, 200
        else:
            # Crear nueva venta
            new_sale = DailySale(
                user_id=user_id,
                sale_date=sale_date_obj,
                units_sold=int(units_sold),
                price_per_unit=Decimal(str(price_per_unit)),
                variable_cost_per_unit=Decimal(str(variable_cost_per_unit)),
                product_name=product_name
            )
            db.session.add(new_sale)
            db.session.commit()
            return {'message': 'Venta creada', 'sale': new_sale.to_dict()}, 201

    @staticmethod
    def get_daily_sales(user_id: int, month_year: str = None):
        """Obtiene las ventas diarias del usuario para un mes"""
        if not month_year:
            today = date.today()
            month_year = today.strftime('%Y-%m')
        
        year, month = map(int, month_year.split('-'))
        
        sales = DailySale.query.filter(
            DailySale.user_id == user_id,
            extract('year', DailySale.sale_date) == year,
            extract('month', DailySale.sale_date) == month
        ).order_by(DailySale.sale_date.asc()).all()
        
        return {'sales': [s.to_dict() for s in sales]}, 200

    @staticmethod
    def delete_daily_sale(user_id: int, sale_id: int):
        """Elimina una venta diaria"""
        sale = DailySale.query.filter_by(id=sale_id, user_id=user_id).first()
        if not sale:
            return {'error': 'Venta no encontrada'}, 404
        
        db.session.delete(sale)
        db.session.commit()
        return {'message': 'Venta eliminada'}, 200

    @staticmethod
    def get_sales_report(user_id: int, month_year: str = None):
        """Genera un reporte completo de ventas con cálculos y proyecciones"""
        if not month_year:
            today = date.today()
            month_year = today.strftime('%Y-%m')
        
        # Obtener parámetros mensuales
        params_result, _ = SalesController.get_monthly_parameters(user_id, month_year)
        params = params_result['parameters']
        
        # Obtener ventas del mes
        sales_result, _ = SalesController.get_daily_sales(user_id, month_year)
        sales = sales_result['sales']
        
        # Calcular estadísticas acumuladas
        total_units = sum(s['units_sold'] for s in sales)
        total_revenue = sum(s['revenue'] for s in sales)
        total_variable_costs = sum(s['total_variable_costs'] for s in sales)
        total_gross_profit = sum(s['gross_profit'] for s in sales)
        
        # Calcular días transcurridos y días restantes
        year, month = map(int, month_year.split('-'))
        today = date.today()
        first_day = date(year, month, 1)
        
        # Calcular último día del mes
        if month == 12:
            last_day = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)
        
        days_elapsed = min((today - first_day).days + 1, (last_day - first_day).days + 1)
        if today < first_day:
            days_elapsed = 0
        elif today > last_day:
            days_elapsed = (last_day - first_day).days + 1
        
        days_remaining = max(0, params['working_days_per_month'] - days_elapsed)
        days_with_sales = len(sales)
        
        # Costos fijos diarios y acumulados
        daily_fixed_costs = params['daily_fixed_costs']
        accumulated_fixed_costs = daily_fixed_costs * days_elapsed
        total_loan_payment = params['loan_monthly_payment'] or 0.0
        
        # Utilidad neta diaria promedio y acumulada
        net_profit_daily_avg = (total_gross_profit / days_with_sales - daily_fixed_costs) if days_with_sales > 0 else 0.0
        accumulated_net_profit = total_gross_profit - accumulated_fixed_costs
        accumulated_net_profit_after_loan = accumulated_net_profit - (total_loan_payment * days_elapsed / params['working_days_per_month'])
        
        # Meta diaria y unidades promedio por día
        daily_target_units = params['daily_target_units']
        avg_units_per_day = total_units / days_with_sales if days_with_sales > 0 else 0.0
        units_per_day_needed = total_units / days_elapsed if days_elapsed > 0 else 0.0
        
        # Proyección al final del mes
        if days_elapsed > 0:
            projected_units_month_end = (units_per_day_needed * params['working_days_per_month'])
            projected_revenue_month_end = (total_revenue / days_elapsed) * params['working_days_per_month']
            projected_gross_profit_month_end = (total_gross_profit / days_elapsed) * params['working_days_per_month']
            projected_net_profit_month_end = projected_gross_profit_month_end - params['fixed_costs_monthly']
            projected_net_profit_after_loan = projected_net_profit_month_end - total_loan_payment
        else:
            projected_units_month_end = 0
            projected_revenue_month_end = 0
            projected_gross_profit_month_end = 0
            projected_net_profit_month_end = 0
            projected_net_profit_after_loan = 0
        
        # Diferencia para alcanzar meta
        units_to_target = max(0, params['target_monthly_sales'] - total_units)
        units_needed_daily = units_to_target / days_remaining if days_remaining > 0 else 0
        
        # Margen de ganancia
        profit_margin_daily = (net_profit_daily_avg / (total_revenue / days_with_sales) * 100) if days_with_sales > 0 and total_revenue > 0 else 0.0
        profit_margin_accumulated = (accumulated_net_profit / total_revenue * 100) if total_revenue > 0 else 0.0
        
        # Alertas
        is_on_target = units_per_day_needed >= daily_target_units if days_elapsed > 0 else True
        is_at_risk = projected_units_month_end < params['target_monthly_sales'] * 0.8 if days_elapsed > 0 else False
        
        return {
            'month_year': month_year,
            'parameters': params,
            'sales': sales,
            'statistics': {
                'days_elapsed': days_elapsed,
                'days_remaining': days_remaining,
                'days_with_sales': days_with_sales,
                'total_units': total_units,
                'total_revenue': round(total_revenue, 2),
                'total_variable_costs': round(total_variable_costs, 2),
                'total_gross_profit': round(total_gross_profit, 2),
                'accumulated_fixed_costs': round(accumulated_fixed_costs, 2),
                'accumulated_net_profit': round(accumulated_net_profit, 2),
                'accumulated_net_profit_after_loan': round(accumulated_net_profit_after_loan, 2),
                'daily_target_units': daily_target_units,
                'avg_units_per_day': round(avg_units_per_day, 2),
                'units_per_day_needed': round(units_per_day_needed, 2),
                'net_profit_daily_avg': round(net_profit_daily_avg, 2),
                'projected_units_month_end': round(projected_units_month_end, 2),
                'projected_revenue_month_end': round(projected_revenue_month_end, 2),
                'projected_gross_profit_month_end': round(projected_gross_profit_month_end, 2),
                'projected_net_profit_month_end': round(projected_net_profit_month_end, 2),
                'projected_net_profit_after_loan': round(projected_net_profit_after_loan, 2),
                'units_to_target': round(units_to_target, 2),
                'units_needed_daily': round(units_needed_daily, 2),
                'profit_margin_daily': round(profit_margin_daily, 2),
                'profit_margin_accumulated': round(profit_margin_accumulated, 2),
                'is_on_target': is_on_target,
                'is_at_risk': is_at_risk
            }
        }, 200

