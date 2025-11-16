import React, { useState, useEffect } from 'react';
import { getViabilityHistory, deleteViabilityFromHistory } from '../utils/history';
import './UserManagement.css';

const ViabilityHistory = () => {
  const [history, setHistory] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const data = getViabilityHistory();
    setHistory(data);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(value);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este análisis del historial?')) {
      deleteViabilityFromHistory(id);
      loadHistory();
      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(null);
      }
    }
  };

  const loadAnalysis = (analysis) => {
    setSelectedAnalysis(analysis);
  };

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>📊 Historial de Análisis de Viabilidad</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Lista de análisis */}
        <div className="profile-section">
          <div className="profile-section-header">
            <h3>Análisis Guardados ({history.length})</h3>
          </div>
          <div className="profile-section-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {history.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                No hay análisis guardados aún.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.map((analysis) => (
                  <div
                    key={analysis.id}
                    style={{
                      border: selectedAnalysis?.id === analysis.id ? '2px solid #667eea' : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      background: selectedAnalysis?.id === analysis.id ? '#f0f4ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => loadAnalysis(analysis)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: '#333' }}>
                          {analysis.params?.industry || 'Sin rubro'}
                        </strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                          Utilidad: {formatCurrency(analysis.results?.profitMonthly || 0)}/mes
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#999' }}>
                          {analysis.fecha}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(analysis.id);
                        }}
                        style={{
                          background: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                    <div style={{ fontSize: '12px', color: '#555' }}>
                      ROI: <strong>{(analysis.results?.roi || 0).toFixed(2)}%</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detalles del análisis seleccionado */}
        {selectedAnalysis ? (
          <div className="profile-section">
            <div className="profile-section-header">
              <h3>Detalles del Análisis</h3>
              <div className="actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    // Prellenar el análisis con estos datos
                    localStorage.setItem('viabilityDataFromHistory', JSON.stringify({
                      ...selectedAnalysis.formData,
                      params: selectedAnalysis.params,
                      fromHistory: true,
                      historyId: selectedAnalysis.id
                    }));
                    window.dispatchEvent(new CustomEvent('navigateToViability', { 
                      detail: { section: 'mi-mentora-ia' } 
                    }));
                  }}
                >
                  📝 Usar este análisis
                </button>
              </div>
            </div>
            <div className="profile-section-body">
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  <strong>Fecha:</strong> {selectedAnalysis.fecha}
                </p>
                {selectedAnalysis.params?.industry && (
                  <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                    <strong>Rubro:</strong> {selectedAnalysis.params.industry}
                  </p>
                )}
              </div>

              <h4>Parámetros del Análisis</h4>
              <table style={{ width: '100%', marginBottom: '20px' }}>
                <tbody>
                  <tr>
                    <td><strong>Costos fijos mensuales:</strong></td>
                    <td>{formatCurrency(parseFloat(selectedAnalysis.formData.fixedCosts || 0))}</td>
                  </tr>
                  <tr>
                    <td><strong>Costo variable por unidad:</strong></td>
                    <td>{formatCurrency(parseFloat(selectedAnalysis.formData.variableCostPerUnit || 0))}</td>
                  </tr>
                  <tr>
                    <td><strong>Precio por unidad:</strong></td>
                    <td>{formatCurrency(parseFloat(selectedAnalysis.formData.pricePerUnit || 0))}</td>
                  </tr>
                  <tr>
                    <td><strong>Ventas esperadas:</strong></td>
                    <td>{Number(selectedAnalysis.formData.expectedMonthlySalesUnits || 0).toLocaleString()} unidades/mes</td>
                  </tr>
                  <tr>
                    <td><strong>Inversión inicial:</strong></td>
                    <td>{formatCurrency(parseFloat(selectedAnalysis.formData.initialInvestment || 0))}</td>
                  </tr>
                  <tr>
                    <td><strong>Periodo para ROI:</strong></td>
                    <td>{selectedAnalysis.formData.months} meses</td>
                  </tr>
                  <tr>
                    <td><strong>Meta de ganancia:</strong></td>
                    <td>{formatCurrency(parseFloat(selectedAnalysis.formData.desiredProfit || 0))}/mes</td>
                  </tr>
                </tbody>
              </table>

              {selectedAnalysis.results && (
                <>
                  <h4>Resultados Calculados</h4>
                  <div className="kpi-grid" style={{ marginBottom: '20px' }}>
                    <div className="kpi-card">
                      <div className="kpi-title">Margen de contribución</div>
                      <div className="kpi-value">
                        {formatCurrency(selectedAnalysis.results.contrib || 0)}
                      </div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-title">Punto de equilibrio</div>
                      <div className="kpi-value">
                        {isFinite(selectedAnalysis.results.peUnits) 
                          ? Math.ceil(selectedAnalysis.results.peUnits || 0).toLocaleString() 
                          : 'N/A'}
                      </div>
                      <small style={{ fontSize: '11px', color: '#666' }}>unidades</small>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-title">Utilidad mensual</div>
                      <div className="kpi-value">
                        {formatCurrency(selectedAnalysis.results.profitMonthly || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="kpi-grid" style={{ marginBottom: '20px' }}>
                    <div className="kpi-card">
                      <div className="kpi-title">Margen de ganancia</div>
                      <div className="kpi-value">
                        {(selectedAnalysis.results.profitMargin || 0).toFixed(2)}%
                      </div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-title">ROI</div>
                      <div className="kpi-value">
                        {(selectedAnalysis.results.roi || 0).toFixed(2)}%
                      </div>
                      <small style={{ fontSize: '11px', color: '#666' }}>
                        en {selectedAnalysis.results.months || 12} meses
                      </small>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-title">Estado</div>
                      <div className="kpi-value" style={{ 
                        color: (selectedAnalysis.results.profitMonthly || 0) >= 0 ? '#4caf50' : '#e74c3c',
                        fontSize: '16px'
                      }}>
                        {(selectedAnalysis.results.profitMonthly || 0) >= 0 ? '✅ Rentable' : '❌ No rentable'}
                      </div>
                    </div>
                  </div>

                  {selectedAnalysis.results.scenarios && selectedAnalysis.results.scenarios.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h4>Escenarios Simulados</h4>
                      <table style={{ width: '100%', marginTop: '12px', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Escenario</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Unidades</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Ingresos</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Costos Totales</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Utilidad</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAnalysis.results.scenarios.map((scenario, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: '8px' }}>{scenario.name}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>{scenario.units?.toLocaleString() || 0}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(scenario.ingresos || 0)}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(scenario.costosTot || 0)}</td>
                              <td style={{ padding: '8px', textAlign: 'right', color: (scenario.utilidad || 0) >= 0 ? '#4caf50' : '#e74c3c' }}>
                                {formatCurrency(scenario.utilidad || 0)}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>
                                {(scenario.utilidad || 0) >= 0 ? '✅' : '❌'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="profile-section">
            <div className="profile-section-body" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p style={{ fontSize: '18px', marginBottom: '12px' }}>📋</p>
              <p>Selecciona un análisis del historial para ver sus detalles</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViabilityHistory;

