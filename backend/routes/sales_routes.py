"""
Rutas para gestión de ventas diarias
"""
from flask import Blueprint, request, jsonify
from controllers.sales_controller import SalesController
from models.user import User

sales_bp = Blueprint('sales', __name__)

@sales_bp.route('/parameters/<int:user_id>', methods=['GET'])
def get_parameters(user_id):
    """Obtiene los parámetros mensuales del usuario"""
    try:
        month_year = request.args.get('month_year')
        result, status = SalesController.get_monthly_parameters(user_id, month_year)
        return jsonify(result), status
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@sales_bp.route('/parameters/<int:user_id>', methods=['PUT'])
def update_parameters(user_id):
    """Actualiza los parámetros mensuales del usuario"""
    try:
        data = request.get_json() or {}
        month_year = data.get('month_year')
        if not month_year:
            from datetime import date
            month_year = date.today().strftime('%Y-%m')
        
        result, status = SalesController.update_monthly_parameters(
            user_id=user_id,
            month_year=month_year,
            target_monthly_sales=data.get('target_monthly_sales'),
            fixed_costs_monthly=data.get('fixed_costs_monthly'),
            loan_monthly_payment=data.get('loan_monthly_payment'),
            working_days_per_month=data.get('working_days_per_month'),
            default_price_per_unit=data.get('default_price_per_unit'),
            default_variable_cost_per_unit=data.get('default_variable_cost_per_unit')
        )
        return jsonify(result), status
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@sales_bp.route('/sales/<int:user_id>', methods=['GET'])
def get_sales(user_id):
    """Obtiene las ventas diarias del usuario"""
    try:
        month_year = request.args.get('month_year')
        result, status = SalesController.get_daily_sales(user_id, month_year)
        return jsonify(result), status
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@sales_bp.route('/sales/<int:user_id>', methods=['POST'])
def create_sale(user_id):
    """Crea o actualiza una venta diaria"""
    try:
        data = request.get_json() or {}
        
        if not data.get('sale_date'):
            return jsonify({'error': 'sale_date es requerido'}), 400
        if data.get('units_sold') is None:
            return jsonify({'error': 'units_sold es requerido'}), 400
        if data.get('price_per_unit') is None:
            return jsonify({'error': 'price_per_unit es requerido'}), 400
        if data.get('variable_cost_per_unit') is None:
            return jsonify({'error': 'variable_cost_per_unit es requerido'}), 400
        
        result, status = SalesController.create_daily_sale(
            user_id=user_id,
            sale_date=data['sale_date'],
            units_sold=int(data['units_sold']),
            price_per_unit=float(data['price_per_unit']),
            variable_cost_per_unit=float(data['variable_cost_per_unit']),
            product_name=data.get('product_name')
        )
        return jsonify(result), status
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@sales_bp.route('/sales/<int:user_id>/<int:sale_id>', methods=['DELETE'])
def delete_sale(user_id, sale_id):
    """Elimina una venta diaria"""
    try:
        result, status = SalesController.delete_daily_sale(user_id, sale_id)
        return jsonify(result), status
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@sales_bp.route('/report/<int:user_id>', methods=['GET'])
def get_report(user_id):
    """Obtiene el reporte completo de ventas con cálculos y proyecciones"""
    try:
        month_year = request.args.get('month_year')
        result, status = SalesController.get_sales_report(user_id, month_year)
        return jsonify(result), status
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

