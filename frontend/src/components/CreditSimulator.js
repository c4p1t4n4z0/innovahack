import React, { useState } from 'react';
import './CreditSimulator.css';

const CreditSimulator = () => {
  const [formData, setFormData] = useState({
    monto: '',
    plazo: '',
    tasaAnual: '',
    tipoCuota: 'fija'
  });

  const [resultados, setResultados] = useState(null);
  const [cronograma, setCronograma] = useState([]);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const calcularCuotaFija = (monto, tasaMensual, plazo) => {
    if (tasaMensual === 0) {
      return monto / plazo;
    }
    const factor = Math.pow(1 + tasaMensual, plazo);
    return monto * (tasaMensual * factor) / (factor - 1);
  };

  const calcularAmortizacion = (monto, plazo, tasaAnual, tipoCuota) => {
    const tasaMensual = tasaAnual / 100 / 12;
    const cronogramaPagos = [];
    let saldoRestante = monto;

    if (tipoCuota === 'fija') {
      const cuotaMensual = calcularCuotaFija(monto, tasaMensual, plazo);
      let interesesTotales = 0;

      for (let mes = 1; mes <= plazo; mes++) {
        const intereses = saldoRestante * tasaMensual;
        const capital = cuotaMensual - intereses;
        saldoRestante -= capital;
        interesesTotales += intereses;

        cronogramaPagos.push({
          mes,
          cuota: cuotaMensual,
          capital: Math.max(0, capital),
          intereses,
          saldoRestante: Math.max(0, saldoRestante)
        });
      }

      return {
        cuotaMensual,
        interesesTotales,
        totalPagar: monto + interesesTotales
      };
    } else {
      // Cuota variable (amortización constante)
      const amortizacionCapital = monto / plazo;
      let interesesTotales = 0;
      let cuotaTotal = 0;

      for (let mes = 1; mes <= plazo; mes++) {
        const intereses = saldoRestante * tasaMensual;
        const capital = amortizacionCapital;
        const cuotaMensual = capital + intereses;
        saldoRestante -= capital;
        interesesTotales += intereses;
        cuotaTotal += cuotaMensual;

        cronogramaPagos.push({
          mes,
          cuota: cuotaMensual,
          capital: Math.max(0, capital),
          intereses,
          saldoRestante: Math.max(0, saldoRestante)
        });
      }

      return {
        cuotaMensual: amortizacionCapital + (monto * tasaMensual), // Primera cuota como referencia
        interesesTotales,
        totalPagar: monto + interesesTotales
      };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const monto = parseFloat(formData.monto);
    const plazo = parseInt(formData.plazo);
    const tasaAnual = parseFloat(formData.tasaAnual);

    // Validaciones
    if (!monto || monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (!plazo || plazo <= 0 || plazo > 360) {
      setError('El plazo debe estar entre 1 y 360 meses');
      return;
    }

    if (tasaAnual < 0 || tasaAnual > 100) {
      setError('La tasa de interés debe estar entre 0 y 100%');
      return;
    }

    // Calcular resultados
    const resultado = calcularAmortizacion(monto, plazo, tasaAnual, formData.tipoCuota);
    const cronogramaResult = [];

    const tasaMensual = tasaAnual / 100 / 12;
    let saldoRestante = monto;

    if (formData.tipoCuota === 'fija') {
      const cuotaMensual = calcularCuotaFija(monto, tasaMensual, plazo);
      
      for (let mes = 1; mes <= plazo; mes++) {
        const intereses = saldoRestante * tasaMensual;
        const capital = cuotaMensual - intereses;
        saldoRestante -= capital;

        cronogramaResult.push({
          mes,
          cuota: cuotaMensual.toFixed(2),
          capital: Math.max(0, capital).toFixed(2),
          intereses: intereses.toFixed(2),
          saldoRestante: Math.max(0, saldoRestante).toFixed(2)
        });
      }
    } else {
      const amortizacionCapital = monto / plazo;
      
      for (let mes = 1; mes <= plazo; mes++) {
        const intereses = saldoRestante * tasaMensual;
        const capital = amortizacionCapital;
        const cuotaMensual = capital + intereses;
        saldoRestante -= capital;

        cronogramaResult.push({
          mes,
          cuota: cuotaMensual.toFixed(2),
          capital: capital.toFixed(2),
          intereses: intereses.toFixed(2),
          saldoRestante: Math.max(0, saldoRestante).toFixed(2)
        });
      }
    }

    setResultados(resultado);
    setCronograma(cronogramaResult);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="credit-simulator">
      <div className="simulator-header">
        <h2>Simulador de Crédito</h2>
        <p className="subtitle">Calcula tu préstamo antes de solicitarlo</p>
      </div>

      <div className="simulator-container">
        <div className="simulator-form-section">
          <form onSubmit={handleSubmit} className="simulator-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="monto">
                  Monto del Crédito (Bs) *
                </label>
                <input
                  type="number"
                  id="monto"
                  name="monto"
                  value={formData.monto}
                  onChange={handleInputChange}
                  placeholder="Ej: 10000"
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="plazo">
                  Plazo (meses) *
                </label>
                <input
                  type="number"
                  id="plazo"
                  name="plazo"
                  value={formData.plazo}
                  onChange={handleInputChange}
                  placeholder="Ej: 12"
                  min="1"
                  max="360"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tasaAnual">
                  Tasa de Interés Anual (%) *
                </label>
                <input
                  type="number"
                  id="tasaAnual"
                  name="tasaAnual"
                  value={formData.tasaAnual}
                  onChange={handleInputChange}
                  placeholder="Ej: 12"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tipoCuota">
                  Tipo de Cuota *
                </label>
                <select
                  id="tipoCuota"
                  name="tipoCuota"
                  value={formData.tipoCuota}
                  onChange={handleInputChange}
                  required
                >
                  <option value="fija">Cuota Fija</option>
                  <option value="variable">Cuota Variable (Amortización Constante)</option>
                </select>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" className="btn-calculate">
              🧮 Calcular Crédito
            </button>
          </form>
        </div>

        {resultados && (
          <div className="simulator-results-section">
            <h3>Resultados del Simulador</h3>
            
            <div className="results-grid">
              <div className="result-card">
                <div className="result-icon">💰</div>
                <div className="result-content">
                  <h4>Cuota Mensual</h4>
                  <p className="result-value">
                    {formData.tipoCuota === 'fija' 
                      ? formatCurrency(resultados.cuotaMensual)
                      : `${formatCurrency(resultados.cuotaMensual)} (aprox. primera cuota)`
                    }
                  </p>
                  <span className="result-note">
                    {formData.tipoCuota === 'variable' && 'Disminuye cada mes'}
                  </span>
                </div>
              </div>

              <div className="result-card">
                <div className="result-icon">📊</div>
                <div className="result-content">
                  <h4>Intereses Totales</h4>
                  <p className="result-value">
                    {formatCurrency(resultados.interesesTotales)}
                  </p>
                </div>
              </div>

              <div className="result-card">
                <div className="result-icon">📅</div>
                <div className="result-content">
                  <h4>Plazo</h4>
                  <p className="result-value">
                    {formData.plazo} {formData.plazo === 1 ? 'mes' : 'meses'}
                  </p>
                  <span className="result-note">
                    ({parseFloat(formData.plazo / 12).toFixed(1)} años)
                  </span>
                </div>
              </div>

              <div className="result-card">
                <div className="result-icon">📈</div>
                <div className="result-content">
                  <h4>Tasa de Interés</h4>
                  <p className="result-value">
                    {formData.tasaAnual}% anual
                  </p>
                  <span className="result-note">
                    ({(formData.tasaAnual / 12).toFixed(2)}% mensual)
                  </span>
                </div>
              </div>

              <div className="result-card highlight">
                <div className="result-icon">💵</div>
                <div className="result-content">
                  <h4>Costo Total del Crédito</h4>
                  <p className="result-value large">
                    {formatCurrency(resultados.totalPagar)}
                  </p>
                  <span className="result-note">
                    Capital: {formatCurrency(parseFloat(formData.monto))} + 
                    Intereses: {formatCurrency(resultados.interesesTotales)}
                  </span>
                </div>
              </div>
            </div>

            {cronograma.length > 0 && (
              <div className="payment-schedule">
                <h3>Cronograma de Pagos</h3>
                <div className="schedule-container">
                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th>Mes</th>
                        <th>Cuota</th>
                        <th>Capital</th>
                        <th>Intereses</th>
                        <th>Saldo Restante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cronograma.slice(0, 12).map((pago) => (
                        <tr key={pago.mes}>
                          <td>{pago.mes}</td>
                          <td>{formatCurrency(parseFloat(pago.cuota))}</td>
                          <td>{formatCurrency(parseFloat(pago.capital))}</td>
                          <td>{formatCurrency(parseFloat(pago.intereses))}</td>
                          <td>{formatCurrency(parseFloat(pago.saldoRestante))}</td>
                        </tr>
                      ))}
                      {cronograma.length > 12 && (
                        <tr className="more-rows">
                          <td colSpan="5">
                            ... y {cronograma.length - 12} meses más
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  {cronograma.length > 12 && (
                    <details className="full-schedule">
                      <summary>Ver cronograma completo ({cronograma.length} meses)</summary>
                      <div className="schedule-container full">
                        <table className="schedule-table">
                          <thead>
                            <tr>
                              <th>Mes</th>
                              <th>Cuota</th>
                              <th>Capital</th>
                              <th>Intereses</th>
                              <th>Saldo Restante</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cronograma.map((pago) => (
                              <tr key={pago.mes}>
                                <td>{pago.mes}</td>
                                <td>{formatCurrency(parseFloat(pago.cuota))}</td>
                                <td>{formatCurrency(parseFloat(pago.capital))}</td>
                                <td>{formatCurrency(parseFloat(pago.intereses))}</td>
                                <td>{formatCurrency(parseFloat(pago.saldoRestante))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditSimulator;

