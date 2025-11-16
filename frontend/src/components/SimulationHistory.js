import React, { useState, useEffect } from 'react';
import { getSimulationHistory, deleteSimulationFromHistory } from '../utils/history';
import './UserManagement.css';

const SimulationHistory = () => {
  const [history, setHistory] = useState([]);
  const [selectedSimulation, setSelectedSimulation] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const data = getSimulationHistory();
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
    if (window.confirm('¿Estás seguro de que quieres eliminar esta simulación del historial?')) {
      deleteSimulationFromHistory(id);
      loadHistory();
      if (selectedSimulation?.id === id) {
        setSelectedSimulation(null);
      }
    }
  };

  const loadSimulation = (simulation) => {
    setSelectedSimulation(simulation);
  };

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>📜 Historial de Simulaciones de Crédito</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Lista de simulaciones */}
        <div className="profile-section">
          <div className="profile-section-header">
            <h3>Simulaciones Guardadas ({history.length})</h3>
          </div>
          <div className="profile-section-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {history.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                No hay simulaciones guardadas aún.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.map((sim) => (
                  <div
                    key={sim.id}
                    style={{
                      border: selectedSimulation?.id === sim.id ? '2px solid #667eea' : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      background: selectedSimulation?.id === sim.id ? '#f0f4ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => loadSimulation(sim)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: '#333' }}>
                          {formatCurrency(parseFloat(sim.formData.monto || 0))}
                        </strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                          {sim.formData.plazo} meses • {sim.formData.tasaAnual}% anual
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#999' }}>
                          {sim.fecha}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(sim.id);
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
                      Cuota: <strong>{formatCurrency(sim.resultados.cuotaMensual)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detalles de la simulación seleccionada */}
        {selectedSimulation ? (
          <div className="profile-section">
            <div className="profile-section-header">
              <h3>Detalles de la Simulación</h3>
              <div className="actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    // Prellenar el simulador con estos datos
                    localStorage.setItem('loanDataFromHistory', JSON.stringify({
                      ...selectedSimulation.formData,
                      fromHistory: true,
                      historyId: selectedSimulation.id
                    }));
                    window.dispatchEvent(new CustomEvent('navigateToSimulator', { 
                      detail: { section: 'simulador' } 
                    }));
                  }}
                >
                  📝 Usar esta simulación
                </button>
              </div>
            </div>
            <div className="profile-section-body">
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  <strong>Fecha:</strong> {selectedSimulation.fecha}
                </p>
              </div>

              <h4>Datos del Préstamo</h4>
              <table style={{ width: '100%', marginBottom: '20px' }}>
                <tbody>
                  <tr>
                    <td><strong>Monto:</strong></td>
                    <td>{formatCurrency(parseFloat(selectedSimulation.formData.monto || 0))}</td>
                  </tr>
                  <tr>
                    <td><strong>Plazo:</strong></td>
                    <td>{selectedSimulation.formData.plazo} meses ({(parseFloat(selectedSimulation.formData.plazo) / 12).toFixed(1)} años)</td>
                  </tr>
                  <tr>
                    <td><strong>Tasa de interés:</strong></td>
                    <td>{selectedSimulation.formData.tasaAnual}% anual ({(parseFloat(selectedSimulation.formData.tasaAnual) / 12).toFixed(2)}% mensual)</td>
                  </tr>
                  <tr>
                    <td><strong>Tipo de cuota:</strong></td>
                    <td>{selectedSimulation.formData.tipoCuota === 'fija' ? 'Cuota Fija' : 'Cuota Variable'}</td>
                  </tr>
                </tbody>
              </table>

              <h4>Resultados Calculados</h4>
              <div className="kpi-grid" style={{ marginBottom: '20px' }}>
                <div className="kpi-card">
                  <div className="kpi-title">Cuota Mensual</div>
                  <div className="kpi-value">
                    {formatCurrency(selectedSimulation.resultados.cuotaMensual)}
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-title">Intereses Totales</div>
                  <div className="kpi-value">
                    {formatCurrency(selectedSimulation.resultados.interesesTotales)}
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-title">Costo Total</div>
                  <div className="kpi-value">
                    {formatCurrency(selectedSimulation.resultados.totalPagar)}
                  </div>
                </div>
              </div>

              {selectedSimulation.utilidadMensual && (
                <div style={{ 
                  background: '#e8f5e9', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  border: '1px solid #4caf50'
                }}>
                  <strong>💡 Información adicional:</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                    Utilidad mensual estimada: <strong>{formatCurrency(selectedSimulation.utilidadMensual)}</strong>
                    {selectedSimulation.fromViability && ' (Desde análisis de viabilidad)'}
                  </p>
                </div>
              )}

              {selectedSimulation.aiInterpretation && (
                <div>
                  <h4>Interpretación con Inteligencia Artificial</h4>
                  <div style={{
                    background: '#f5f5f5',
                    padding: '16px',
                    borderRadius: '8px',
                    marginTop: '12px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    {selectedSimulation.aiInterpretation.split('\n').map((line, index) => {
                      if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                        return <h4 key={index} style={{ margin: '12px 0 8px 0', color: '#667eea' }}>{line.replace(/\*\*/g, '')}</h4>;
                      }
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={index} style={{ margin: '8px 0', lineHeight: '1.6' }}>
                          {parts.map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={i} style={{ color: '#667eea' }}>{part.replace(/\*\*/g, '')}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedSimulation.cronograma && selectedSimulation.cronograma.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4>Cronograma de Pagos (Primeros 12 meses)</h4>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '12px' }}>
                    <table style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Mes</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Cuota</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Capital</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Intereses</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSimulation.cronograma.map((pago) => (
                          <tr key={pago.mes}>
                            <td style={{ padding: '8px' }}>{pago.mes}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(parseFloat(pago.cuota))}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(parseFloat(pago.capital))}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(parseFloat(pago.intereses))}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(parseFloat(pago.saldoRestante))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="profile-section">
            <div className="profile-section-body" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p style={{ fontSize: '18px', marginBottom: '12px' }}>📋</p>
              <p>Selecciona una simulación del historial para ver sus detalles</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationHistory;

