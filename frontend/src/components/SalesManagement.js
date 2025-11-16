import React, { useState, useEffect, useRef } from 'react';
import { salesService } from '../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './SalesManagement.css';

const SalesManagement = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estado para parámetros mensuales
  const [parameters, setParameters] = useState({
    target_monthly_sales: 0,
    fixed_costs_monthly: 0,
    loan_monthly_payment: 0,
    working_days_per_month: 30,
    default_price_per_unit: null,
    default_variable_cost_per_unit: null
  });
  
  // Estado para ventas
  const [sales, setSales] = useState([]);
  const [report, setReport] = useState(null);
  
  // Estado para formulario de nueva venta
  const [newSale, setNewSale] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    product_name: '',
    units_sold: '',
    price_per_unit: '',
    variable_cost_per_unit: ''
  });
  
  // Estado para mes seleccionado
  const [monthYear, setMonthYear] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [showParametersModal, setShowParametersModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);

  // Cargar datos al montar o cambiar mes
  useEffect(() => {
    loadData();
  }, [monthYear, user.id]);

  // Integrar con simulador de crédito y análisis de viabilidad
  useEffect(() => {
    // Leer cuota del simulador de crédito
    const latestSimulation = localStorage.getItem(`simulation_history_${user.id}`);
    if (latestSimulation) {
      try {
        const simulations = JSON.parse(latestSimulation);
        if (simulations.length > 0) {
          const latest = simulations[0];
          if (latest.cuotaMensual) {
            setParameters(prev => ({
              ...prev,
              loan_monthly_payment: latest.cuotaMensual
            }));
          }
        }
      } catch (e) {
        console.error('Error al leer simulación:', e);
      }
    }

    // Leer datos del análisis de viabilidad (desde historial)
    const viabilityData = localStorage.getItem(`viability_history_${user.id}`);
    if (viabilityData) {
      try {
        const viabilities = JSON.parse(viabilityData);
        if (viabilities.length > 0) {
          const latest = viabilities[0];
          if (latest.pricePerUnit) {
            setParameters(prev => ({
              ...prev,
              default_price_per_unit: latest.pricePerUnit,
              default_variable_cost_per_unit: latest.variableCostPerUnit,
              fixed_costs_monthly: latest.fixedCosts || prev.fixed_costs_monthly,
              target_monthly_sales: latest.expectedMonthlySalesUnits || prev.target_monthly_sales
            }));
          }
        }
      } catch (e) {
        console.error('Error al leer análisis de viabilidad:', e);
      }
    }
  }, [user.id]);

  // Leer datos directamente desde análisis de viabilidad cuando se abre el modal
  const loadViabilityDataForNewSale = () => {
    try {
      const salesDataFromViability = localStorage.getItem('salesDataFromViability');
      if (salesDataFromViability) {
        const data = JSON.parse(salesDataFromViability);
        console.log('Datos cargados desde análisis de viabilidad:', data);
        
        // Pre-llenar el formulario de nueva venta
        setNewSale(prev => ({
          ...prev,
          price_per_unit: data.pricePerUnit?.toString() || prev.price_per_unit || '',
          variable_cost_per_unit: data.variableCostPerUnit?.toString() || prev.variable_cost_per_unit || ''
        }));
        
        // Actualizar parámetros mensuales si es necesario
        if (data.fromViability) {
          setParameters(prev => ({
            ...prev,
            default_price_per_unit: data.pricePerUnit || prev.default_price_per_unit,
            default_variable_cost_per_unit: data.variableCostPerUnit || prev.default_variable_cost_per_unit,
            fixed_costs_monthly: data.fixedCosts || prev.fixed_costs_monthly,
            target_monthly_sales: data.expectedMonthlySalesUnits || prev.target_monthly_sales,
            loan_monthly_payment: data.loanMonthlyPayment || prev.loan_monthly_payment
          }));
          
          // Mostrar mensaje de éxito
          setSuccess('✅ Datos del análisis de viabilidad aplicados. Recuerda guardar los parámetros si los modificaste.');
          setTimeout(() => setSuccess(''), 5000);
          
          // Limpiar el flag después de usarlo
          localStorage.removeItem('salesDataFromViability');
        }
      }
    } catch (e) {
      console.error('Error al cargar datos del análisis de viabilidad:', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [paramsRes, salesRes, reportRes] = await Promise.all([
        salesService.getParameters(user.id, monthYear),
        salesService.getSales(user.id, monthYear),
        salesService.getReport(user.id, monthYear)
      ]);

      if (paramsRes.parameters) {
        setParameters({
          target_monthly_sales: paramsRes.parameters.target_monthly_sales || 0,
          fixed_costs_monthly: paramsRes.parameters.fixed_costs_monthly || 0,
          loan_monthly_payment: paramsRes.parameters.loan_monthly_payment || 0,
          working_days_per_month: paramsRes.parameters.working_days_per_month || 30,
          default_price_per_unit: paramsRes.parameters.default_price_per_unit,
          default_variable_cost_per_unit: paramsRes.parameters.default_variable_cost_per_unit
        });
      }

      if (salesRes.sales) {
        console.log(`[SalesManagement] Cargadas ${salesRes.sales.length} ventas para ${monthYear}:`, salesRes.sales);
        setSales(salesRes.sales);
      } else {
        console.log('[SalesManagement] No se recibieron ventas del servidor');
        setSales([]);
      }

      if (reportRes.statistics) {
        setReport(reportRes);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveParameters = async () => {
    setLoading(true);
    setError('');
    try {
      await salesService.updateParameters(user.id, {
        ...parameters,
        month_year: monthYear
      });
      setSuccess('Parámetros guardados correctamente');
      setTimeout(() => setSuccess(''), 3000);
      setShowParametersModal(false);
      loadData();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar parámetros');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSale = async () => {
    if (!newSale.sale_date || !newSale.units_sold || !newSale.price_per_unit || !newSale.variable_cost_per_unit) {
      setError('Todos los campos son requeridos');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await salesService.createSale(user.id, {
        ...newSale,
        units_sold: parseInt(newSale.units_sold),
        price_per_unit: parseFloat(newSale.price_per_unit),
        variable_cost_per_unit: parseFloat(newSale.variable_cost_per_unit)
      });
      setSuccess('Venta guardada correctamente');
      setTimeout(() => setSuccess(''), 3000);
      setShowSaleModal(false);
      setNewSale({
        sale_date: new Date().toISOString().split('T')[0],
        product_name: '',
        units_sold: '',
        price_per_unit: parameters.default_price_per_unit?.toString() || '',
        variable_cost_per_unit: parameters.default_variable_cost_per_unit?.toString() || ''
      });
      setEditingSale(null);
      loadData();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar venta');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta venta?')) return;

    setLoading(true);
    setError('');
    try {
      await salesService.deleteSale(user.id, saleId);
      setSuccess('Venta eliminada correctamente');
      setTimeout(() => setSuccess(''), 3000);
      // Recargar datos después de eliminar
      setTimeout(() => {
        loadData();
      }, 200);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al eliminar venta');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSale = (sale) => {
    setEditingSale(sale);
    setNewSale({
      sale_date: sale.sale_date,
      product_name: sale.product_name || '',
      units_sold: sale.units_sold.toString(),
      price_per_unit: sale.price_per_unit.toString(),
      variable_cost_per_unit: sale.variable_cost_per_unit.toString()
    });
    setShowSaleModal(true);
  };

  const handleExportPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Ventas Mensuales', 14, 20);
    doc.setFontSize(12);
    doc.text(`Mes: ${monthYear}`, 14, 30);

    // Parámetros
    doc.setFontSize(14);
    doc.text('Parámetros Mensuales', 14, 40);
    doc.setFontSize(10);
    let y = 48;
    doc.text(`Meta de ventas: ${parameters.target_monthly_sales} unidades`, 14, y);
    y += 6;
    doc.text(`Costos fijos: Bs ${parameters.fixed_costs_monthly.toFixed(2)}`, 14, y);
    y += 6;
    if (parameters.loan_monthly_payment > 0) {
      doc.text(`Cuota mensual del crédito: Bs ${parameters.loan_monthly_payment.toFixed(2)}`, 14, y);
      y += 6;
    }

    // Estadísticas
    doc.setFontSize(14);
    doc.text('Estadísticas del Mes', 14, y + 5);
    doc.setFontSize(10);
    y += 13;
    const stats = report.statistics;
    doc.text(`Unidades vendidas: ${stats.total_units}`, 14, y);
    y += 6;
    doc.text(`Ingresos totales: Bs ${stats.total_revenue.toFixed(2)}`, 14, y);
    y += 6;
    doc.text(`Utilidad bruta acumulada: Bs ${stats.total_gross_profit.toFixed(2)}`, 14, y);
    y += 6;
    doc.text(`Utilidad neta acumulada: Bs ${stats.accumulated_net_profit.toFixed(2)}`, 14, y);
    y += 6;
    if (parameters.loan_monthly_payment > 0) {
      doc.text(`Utilidad neta después del crédito: Bs ${stats.accumulated_net_profit_after_loan.toFixed(2)}`, 14, y);
      y += 6;
    }
    doc.text(`Proyección de utilidad al final del mes: Bs ${stats.projected_net_profit_month_end.toFixed(2)}`, 14, y);
    y += 6;
    doc.text(`Unidades restantes para alcanzar la meta: ${stats.units_to_target.toFixed(0)}`, 14, y);

    // Tabla de ventas
    if (sales.length > 0) {
      y += 10;
      doc.setFontSize(14);
      doc.text('Ventas Diarias', 14, y);
      y += 5;

      const tableData = sales.map(s => [
        s.sale_date,
        s.units_sold.toString(),
        `Bs ${s.price_per_unit.toFixed(2)}`,
        `Bs ${s.variable_cost_per_unit.toFixed(2)}`,
        `Bs ${s.revenue.toFixed(2)}`,
        `Bs ${s.gross_profit.toFixed(2)}`
      ]);

      doc.autoTable({
        startY: y,
        head: [['Fecha', 'Unidades', 'Precio/Unidad', 'Costo Variable/Unidad', 'Ingresos', 'Utilidad Bruta']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] }
      });
    }

    doc.save(`reporte_ventas_${monthYear}.pdf`);
    setSuccess('Reporte exportado a PDF');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Preparar datos para gráficos
  const prepareChartData = () => {
    if (!sales || sales.length === 0) return [];

    let cumulativeUnits = 0;
    let cumulativeRevenue = 0;
    let cumulativeProfit = 0;

    return sales.map((sale, index) => {
      cumulativeUnits += sale.units_sold;
      cumulativeRevenue += sale.revenue;
      cumulativeProfit += sale.gross_profit;

      return {
        date: new Date(sale.sale_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        units: sale.units_sold,
        cumulativeUnits,
        cumulativeRevenue,
        cumulativeProfit,
        targetUnits: parameters.target_monthly_sales * ((index + 1) / sales.length),
        dailyTarget: parameters.target_monthly_sales / parameters.working_days_per_month
      };
    });
  };

  const chartData = prepareChartData();

  return (
    <div className="sales-management">
      <div className="sales-header">
        <h2>Gestión de Ventas Diarias</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="month"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <button
            className="btn-secondary"
            onClick={() => setShowParametersModal(true)}
          >
            ⚙️ Parámetros
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setNewSale({
                sale_date: new Date().toISOString().split('T')[0],
                product_name: '',
                units_sold: '',
                price_per_unit: parameters.default_price_per_unit?.toString() || '',
                variable_cost_per_unit: parameters.default_variable_cost_per_unit?.toString() || ''
              });
              setEditingSale(null);
              setShowSaleModal(true);
              // Cargar datos del análisis de viabilidad si existen
              setTimeout(() => {
                loadViabilityDataForNewSale();
              }, 100);
            }}
          >
            ➕ Agregar Venta
          </button>
          {report && (
            <button
              className="btn-secondary"
              onClick={handleExportPDF}
            >
              📄 Exportar PDF
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading && !report ? (
        <div className="loading">Cargando datos...</div>
      ) : (
        <>
          {/* Indicadores principales */}
          {report && (
            <div className="sales-indicators">
              <div className={`indicator-card ${report.statistics.is_on_target ? 'success' : 'warning'}`}>
                <div className="indicator-label">Meta Diaria</div>
                <div className="indicator-value">
                  {report.statistics.units_per_day_needed.toFixed(1)} / {report.statistics.daily_target_units}
                </div>
                <div className="indicator-subtitle">
                  {report.statistics.is_on_target ? '✅ En meta' : '⚠️ Debajo de la meta'}
                </div>
              </div>

              <div className="indicator-card">
                <div className="indicator-label">Unidades Vendidas</div>
                <div className="indicator-value">{report.statistics.total_units}</div>
                <div className="indicator-subtitle">de {parameters.target_monthly_sales} unidades</div>
              </div>

              <div className="indicator-card">
                <div className="indicator-label">Utilidad Neta Acumulada</div>
                <div className="indicator-value">
                  Bs {report.statistics.accumulated_net_profit.toFixed(2)}
                </div>
                {parameters.loan_monthly_payment > 0 && (
                  <div className="indicator-subtitle">
                    Después del crédito: Bs {report.statistics.accumulated_net_profit_after_loan.toFixed(2)}
                  </div>
                )}
              </div>

              <div className={`indicator-card ${report.statistics.is_at_risk ? 'danger' : 'success'}`}>
                <div className="indicator-label">Proyección Mes</div>
                <div className="indicator-value">
                  Bs {report.statistics.projected_net_profit_month_end.toFixed(2)}
                </div>
                <div className="indicator-subtitle">
                  {report.statistics.is_at_risk ? '⚠️ Meta en riesgo' : '✅ Meta alcanzable'}
                </div>
              </div>
            </div>
          )}

          {/* Gráficos */}
          {chartData.length > 0 && (
            <div className="sales-charts">
              <div className="chart-container">
                <h3>Ventas Acumuladas vs Meta</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cumulativeUnits" stroke="#8884d8" name="Unidades Acumuladas" />
                    <Line type="monotone" dataKey="targetUnits" stroke="#82ca9d" name="Meta Acumulada" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Unidades por Día vs Meta Diaria</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="units" fill="#8884d8" name="Unidades Vendidas" />
                    <Bar dataKey="dailyTarget" fill="#82ca9d" name="Meta Diaria" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Utilidad Acumulada</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cumulativeProfit" stroke="#ff7300" name="Utilidad Bruta Acumulada" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tabla de ventas */}
          <div className="sales-table-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Ventas Registradas</h3>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Total: <strong>{sales.length}</strong> {sales.length === 1 ? 'venta' : 'ventas'} en {monthYear}
              </div>
            </div>
            {sales.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Unidades</th>
                      <th>Precio/Unidad</th>
                      <th>Costo Variable/Unidad</th>
                      <th>Ingresos</th>
                      <th>Utilidad Bruta</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale, index) => (
                      <tr key={sale.id}>
                        <td style={{ fontWeight: '500', color: '#666' }}>{index + 1}</td>
                        <td>{new Date(sale.sale_date).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })}</td>
                        <td>{sale.product_name || '-'}</td>
                        <td style={{ textAlign: 'center', fontWeight: '500' }}>{sale.units_sold}</td>
                        <td>Bs {parseFloat(sale.price_per_unit).toFixed(2)}</td>
                        <td>Bs {parseFloat(sale.variable_cost_per_unit).toFixed(2)}</td>
                        <td style={{ fontWeight: '600', color: '#2e7d32' }}>Bs {parseFloat(sale.revenue || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: '600', color: '#1976d2' }}>Bs {parseFloat(sale.gross_profit || 0).toFixed(2)}</td>
                        <td>
                          <button
                            className="btn-edit"
                            onClick={() => handleEditSale(sale)}
                            title="Editar venta"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteSale(sale.id)}
                            title="Eliminar venta"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-sales" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                <p>No hay ventas registradas para el mes {monthYear}</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  Haz clic en "➕ Agregar Venta" para registrar tu primera venta
                </p>
              </div>
            )}
          </div>

          {/* Resumen de estadísticas */}
          {report && (
            <div className="sales-summary">
              <h3>Resumen y Proyecciones</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <label>Días transcurridos:</label>
                  <span>{report.statistics.days_elapsed} de {parameters.working_days_per_month}</span>
                </div>
                <div className="summary-item">
                  <label>Promedio unidades/día:</label>
                  <span>{report.statistics.avg_units_per_day.toFixed(1)}</span>
                </div>
                <div className="summary-item">
                  <label>Unidades necesarias/día para meta:</label>
                  <span>{report.statistics.units_needed_daily.toFixed(1)}</span>
                </div>
                <div className="summary-item">
                  <label>Margen de ganancia acumulado:</label>
                  <span>{report.statistics.profit_margin_accumulated.toFixed(2)}%</span>
                </div>
                <div className="summary-item">
                  <label>Proyección unidades fin de mes:</label>
                  <span>{report.statistics.projected_units_month_end.toFixed(0)}</span>
                </div>
                <div className="summary-item">
                  <label>Proyección utilidad neta fin de mes:</label>
                  <span>Bs {report.statistics.projected_net_profit_month_end.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de parámetros */}
      {showParametersModal && (
        <div className="modal-overlay" onClick={() => setShowParametersModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Parámetros Mensuales</h3>
              <button className="modal-close" onClick={() => setShowParametersModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>Meta de ventas mensual (unidades):</label>
                <input
                  type="number"
                  value={parameters.target_monthly_sales}
                  onChange={(e) => setParameters({ ...parameters, target_monthly_sales: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-row">
                <label>Costos fijos mensuales (Bs):</label>
                <input
                  type="number"
                  step="0.01"
                  value={parameters.fixed_costs_monthly}
                  onChange={(e) => setParameters({ ...parameters, fixed_costs_monthly: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-row">
                <label>Cuota mensual del crédito (Bs) - Opcional:</label>
                <input
                  type="number"
                  step="0.01"
                  value={parameters.loan_monthly_payment}
                  onChange={(e) => setParameters({ ...parameters, loan_monthly_payment: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-row">
                <label>Días hábiles del mes:</label>
                <input
                  type="number"
                  value={parameters.working_days_per_month}
                  onChange={(e) => setParameters({ ...parameters, working_days_per_month: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="form-row">
                <label>Precio por unidad por defecto (Bs) - Opcional:</label>
                <input
                  type="number"
                  step="0.01"
                  value={parameters.default_price_per_unit || ''}
                  onChange={(e) => setParameters({ ...parameters, default_price_per_unit: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>
              <div className="form-row">
                <label>Costo variable por unidad por defecto (Bs) - Opcional:</label>
                <input
                  type="number"
                  step="0.01"
                  value={parameters.default_variable_cost_per_unit || ''}
                  onChange={(e) => setParameters({ ...parameters, default_variable_cost_per_unit: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowParametersModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveParameters} disabled={loading}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de nueva/editar venta */}
      {showSaleModal && (
        <div className="modal-overlay" onClick={() => { setShowSaleModal(false); setEditingSale(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSale ? 'Editar Venta' : 'Agregar Venta Diaria'}</h3>
              <button className="modal-close" onClick={() => { setShowSaleModal(false); setEditingSale(null); }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>Fecha de venta:</label>
                <input
                  type="date"
                  value={newSale.sale_date}
                  onChange={(e) => setNewSale({ ...newSale, sale_date: e.target.value })}
                />
              </div>
              <div className="form-row">
                <label>Producto (opcional):</label>
                <input
                  type="text"
                  value={newSale.product_name}
                  onChange={(e) => setNewSale({ ...newSale, product_name: e.target.value })}
                  placeholder="Nombre del producto"
                />
              </div>
              <div className="form-row">
                <label>Unidades vendidas:</label>
                <input
                  type="number"
                  value={newSale.units_sold}
                  onChange={(e) => setNewSale({ ...newSale, units_sold: e.target.value })}
                  min="0"
                  required
                />
              </div>
              <div className="form-row">
                <label>Precio por unidad (Bs):</label>
                <input
                  type="number"
                  step="0.01"
                  value={newSale.price_per_unit}
                  onChange={(e) => setNewSale({ ...newSale, price_per_unit: e.target.value })}
                  min="0"
                  required
                />
              </div>
              <div className="form-row">
                <label>Costo variable por unidad (Bs):</label>
                <input
                  type="number"
                  step="0.01"
                  value={newSale.variable_cost_per_unit}
                  onChange={(e) => setNewSale({ ...newSale, variable_cost_per_unit: e.target.value })}
                  min="0"
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => { setShowSaleModal(false); setEditingSale(null); }}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveSale} disabled={loading}>
                {editingSale ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesManagement;

