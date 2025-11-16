import React, { useState, useRef, useEffect } from 'react';
import { saveViabilityAnalysisToHistory } from '../utils/history';
import './UserManagement.css';

const Label = ({ children, hint }) => (
  <label title={hint}>{children}</label>
);

const AIMentor = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [params, setParams] = useState({
    industry: user?.business?.category || user?.business?.name || '',
  });
  const [viab, setViab] = useState({
    // Valores de ejemplo para un caso textil (editable por la usuaria)
    fixedCosts: '4000',                  // alquiler, luz, internet, logística
    variableCostPerUnit: '18',           // materiales, mano de obra, insumos, empaque
    pricePerUnit: '35',                  // precio de venta por prenda
    expectedMonthlySalesUnits: '600',    // producción/ventas estimadas
    initialInvestment: '15000',          // opcional
    months: '12',
    desiredProfit: '1000',               // meta de ganancia mensual
    priceSensitivityDelta: '2',          // +/- Bs para sensibilidad de precio
    costSensitivityDelta: '2',           // +/- Bs para sensibilidad de costos
    monthlyLoanPayment: ''               // cuota mensual del crédito (opcional)
  });
  const [viabResult, setViabResult] = useState(null);
  const viabilityRef = useRef(null);

  // Leer datos del historial o del simulador si existen
  useEffect(() => {
    try {
      // Primero verificar si hay datos del simulador de crédito
      const loanData = localStorage.getItem('loanPaymentFromSimulator');
      if (loanData) {
        const data = JSON.parse(loanData);
        console.log('Cuota del crédito recibida del simulador:', data);
        
        if (data.monthlyPayment) {
          setViab(prev => ({
            ...prev,
            monthlyLoanPayment: String(data.monthlyPayment)
          }));
        }
        
        localStorage.removeItem('loanPaymentFromSimulator');
      }
      
      // Luego verificar datos del historial
      const historyData = localStorage.getItem('viabilityDataFromHistory');
      if (historyData) {
        const data = JSON.parse(historyData);
        console.log('Datos cargados desde historial:', data);
        
        if (data.params?.industry) {
          setParams(prev => ({ ...prev, industry: data.params.industry }));
        }
        
        if (data.formData) {
          setViab(prev => ({
            ...prev,
            fixedCosts: data.formData.fixedCosts || '4000',
            variableCostPerUnit: data.formData.variableCostPerUnit || '18',
            pricePerUnit: data.formData.pricePerUnit || '35',
            expectedMonthlySalesUnits: data.formData.expectedMonthlySalesUnits || '600',
            initialInvestment: data.formData.initialInvestment || '15000',
            months: data.formData.months || '12',
            desiredProfit: data.formData.desiredProfit || '1000',
            priceSensitivityDelta: data.formData.priceSensitivityDelta || '2',
            costSensitivityDelta: data.formData.costSensitivityDelta || '2',
            monthlyLoanPayment: data.formData.monthlyLoanPayment || ''
          }));
        }
        
        localStorage.removeItem('viabilityDataFromHistory');
      }
    } catch (e) {
      console.error('Error al leer datos:', e);
    }
  }, []);

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>Mi Mentora IA (Gemini)</h2>
      </div>
      <div className="profile-section" style={{ marginTop: 16 }}>
          <div className="profile-section-header">
            <h3>Análisis de viabilidad y rentabilidad</h3>
            <div className="actions">
              <button
                className="btn-secondary"
                title="Exportar análisis a PDF"
                onClick={() => {
                  try {
                    const win = window.open('', '_blank', 'width=800,height=900');
                    if (!win) return;
                    const styles = `
                      <style>
                        body { font-family: Arial, sans-serif; color: #222; margin: 0; padding: 24px; }
                        h2,h3 { margin: 0 0 8px 0; }
                        .kpi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin: 12px 0; }
                        .kpi-card { background: #fff; border: 1px solid #eef0f6; border-radius: 12px; padding: 12px; }
                        .kpi-title { font-size: 12px; color: #6b7280; }
                        .kpi-value { font-size: 18px; font-weight: 700; color: #111827; }
                        .section { border:1px solid #eef0f6; border-radius:12px; padding:12px; margin: 12px 0; }
                        .row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
                        table { width:100%; border-collapse:collapse; margin-top: 8px; }
                        th, td { border:1px solid #eef0f6; padding:8px; font-size: 13px; text-align:left; }
                        th { background:#fafbff; }
                        @page { margin: 14mm; }
                      </style>
                    `;
                    const html = viabilityRef.current ? viabilityRef.current.innerHTML : '';
                    win.document.write(`<html><head><title>Viabilidad y rentabilidad</title>${styles}</head><body><h2>Mi Mentora IA - Análisis de viabilidad y rentabilidad</h2>${html}</body></html>`);
                    win.document.close();
                    win.focus();
                    win.print();
                    win.close();
                  } catch {}
                }}
              >
                Exportar a PDF
              </button>
            </div>
          </div>
          <div className="profile-section-body" ref={viabilityRef}>
            <form
              className="form-compact"
              onSubmit={(e) => {
                e.preventDefault();
                const fixedCosts = parseFloat(viab.fixedCosts || '0');
                const vc = parseFloat(viab.variableCostPerUnit || '0');
                const price = parseFloat(viab.pricePerUnit || '0');
                const invest = parseFloat(viab.initialInvestment || '0');
                const units = parseFloat(viab.expectedMonthlySalesUnits || '0');
                const months = Math.max(1, parseInt(viab.months || '12', 10));
                const desiredProfit = parseFloat(viab.desiredProfit || '0');
                const dPrice = Math.abs(parseFloat(viab.priceSensitivityDelta || '0') || 0);
                const dCost = Math.abs(parseFloat(viab.costSensitivityDelta || '0') || 0);
                const monthlyLoanPayment = parseFloat(viab.monthlyLoanPayment || '0');
                
                // Costos fijos totales incluyen la cuota del crédito
                const totalFixedCosts = fixedCosts + monthlyLoanPayment;
                
                const contrib = Math.max(0, price - vc);
                const peUnits = contrib > 0 ? totalFixedCosts / contrib : Infinity;
                const peRevenue = isFinite(peUnits) ? peUnits * price : Infinity;
                const revenue = units * price;
                const variable = units * vc;
                
                // Utilidad del negocio (antes de pagar el crédito)
                const profitMonthly = revenue - variable - fixedCosts;
                
                // Utilidad neta (después de pagar el crédito)
                const netProfitMonthly = profitMonthly - monthlyLoanPayment;
                
                const profitMargin = revenue > 0 ? (profitMonthly / revenue) * 100 : 0;
                const netProfitMargin = revenue > 0 ? (netProfitMonthly / revenue) * 100 : 0;
                const profitPeriod = netProfitMonthly * months;
                const roi = invest > 0 ? (profitPeriod / invest) * 100 : 0;
                
                // Escenarios
                const mkScenario = (name, u) => {
                  const ing = u * price;
                  const varc = u * vc;
                  const util = ing - varc - fixedCosts;
                  const utilNeta = util - monthlyLoanPayment;
                  return { 
                    name, 
                    units: u, 
                    ingresos: ing, 
                    costosVar: varc, 
                    costosTot: varc + fixedCosts, 
                    utilidad: util,
                    utilidadNeta: utilNeta,
                    cuotaCredito: monthlyLoanPayment
                  };
                };
                const realistic = mkScenario('Realista', units);
                const optimal = mkScenario('Óptimo (+30%)', Math.round(units * 1.3));
                const pessimistic = mkScenario('Pesimista (-30%)', Math.max(0, Math.round(units * 0.7)));
                // meta de ganancia
                let goalUnits = units;
                if (desiredProfit > 0 && contrib > 0) {
                  goalUnits = Math.ceil((fixedCosts + desiredProfit) / contrib);
                }
                const goal = mkScenario(`Meta (ganar ${desiredProfit.toLocaleString()} BS)`, goalUnits);
                // Sensibilidad
                const priceDown = mkScenario(`Precio -${dPrice} BS`, units);
                priceDown.ingresos = units * (price - dPrice);
                priceDown.utilidad = priceDown.ingresos - units * vc - fixedCosts;
                priceDown.utilidadNeta = priceDown.utilidad - monthlyLoanPayment;
                const priceUp = mkScenario(`Precio +${dPrice} BS`, units);
                priceUp.ingresos = units * (price + dPrice);
                priceUp.utilidad = priceUp.ingresos - units * vc - fixedCosts;
                priceUp.utilidadNeta = priceUp.utilidad - monthlyLoanPayment;
                const peCostUp = contrib - dCost > 0 ? totalFixedCosts / (contrib - dCost) : Infinity;
                const peCostDown = contrib + dCost > 0 ? totalFixedCosts / (contrib + dCost) : Infinity;
                const res = {
                  contrib,
                  peUnits,
                  peRevenue,
                  profitMonthly,
                  netProfitMonthly,
                  profitMargin,
                  netProfitMargin,
                  monthlyLoanPayment,
                  totalFixedCosts,
                  roi,
                  months,
                  scenarios: [realistic, optimal, pessimistic, goal],
                  sensitivity: {
                    priceDown: { delta: dPrice, utilidad: priceDown.utilidad, utilidadNeta: priceDown.utilidadNeta },
                    priceUp: { delta: dPrice, utilidad: priceUp.utilidad, utilidadNeta: priceUp.utilidadNeta },
                    peCostUp,
                    peCostDown
                  },
                  inputs: { fixedCosts, vc, price, units, invest, desiredProfit, monthlyLoanPayment }
                };
                setViabResult(res);
                
                // Guardar en historial automáticamente
                try {
                  saveViabilityAnalysisToHistory({
                    params: {
                      industry: params.industry
                    },
                    formData: {
                      fixedCosts: fixedCosts.toString(),
                      variableCostPerUnit: vc.toString(),
                      pricePerUnit: price.toString(),
                      expectedMonthlySalesUnits: units.toString(),
                      initialInvestment: invest.toString(),
                      months: months.toString(),
                      desiredProfit: desiredProfit.toString(),
                      priceSensitivityDelta: viab.priceSensitivityDelta,
                      costSensitivityDelta: viab.costSensitivityDelta,
                      monthlyLoanPayment: monthlyLoanPayment.toString()
                    },
                    results: {
                      contrib: res.contrib,
                      peUnits: res.peUnits,
                      peRevenue: res.peRevenue,
                      profitMonthly: res.profitMonthly,
                      netProfitMonthly: res.netProfitMonthly,
                      profitMargin: res.profitMargin,
                      netProfitMargin: res.netProfitMargin,
                      monthlyLoanPayment: res.monthlyLoanPayment,
                      totalFixedCosts: res.totalFixedCosts,
                      roi: res.roi,
                      months: res.months,
                      scenarios: res.scenarios,
                      sensitivity: res.sensitivity
                    }
                  });
                } catch (e) {
                  console.error('Error al guardar análisis en historial:', e);
                }
              }}
            >
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <Label hint="Alquiler, luz, internet, depreciación, logística">Costos fijos mensuales (BS)</Label>
                  <input value={viab.fixedCosts} onChange={e => setViab({ ...viab, fixedCosts: e.target.value })} placeholder="Ej: 4000" />
                  <small className="muted">Incluye alquiler, sueldos, servicios, etc.</small>
                </div>
                <div>
                  <Label hint="Tela, hilo, botones/cierres, estampado/bordado, empaque, mano de obra">Costo variable por unidad (BS)</Label>
                  <input value={viab.variableCostPerUnit} onChange={e => setViab({ ...viab, variableCostPerUnit: e.target.value })} placeholder="Ej: 10" />
                  <small className="muted">Materia prima, empaques, comisiones variables.</small>
                </div>
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <Label hint="Precio de venta por prenda (polera, blusa, pantalón, deportiva)">Precio por unidad (BS)</Label>
                  <input value={viab.pricePerUnit} onChange={e => setViab({ ...viab, pricePerUnit: e.target.value })} placeholder="Ej: 25" />
                </div>
                <div>
                  <Label hint="Máquinas, herramientas, capital de trabajo inicial (opcional)">Inversión inicial (BS)</Label>
                  <input value={viab.initialInvestment} onChange={e => setViab({ ...viab, initialInvestment: e.target.value })} placeholder="Ej: 15000" />
                </div>
                <div>
                  <Label hint="Producción/ventas mensuales estimadas (prendas/mes)">Ventas esperadas (unidades/mes)</Label>
                  <input value={viab.expectedMonthlySalesUnits} onChange={e => setViab({ ...viab, expectedMonthlySalesUnits: e.target.value })} placeholder="Ej: 600" />
                </div>
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                <div>
                  <Label hint="Tiempo para evaluar el retorno de inversión">Periodo para ROI (meses)</Label>
                  <input value={viab.months} onChange={e => setViab({ ...viab, months: e.target.value })} placeholder="12" />
                </div>
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <Label hint="Meta de ganancia mensual deseada">Meta de ganancia (BS/mes)</Label>
                  <input value={viab.desiredProfit} onChange={e => setViab({ ...viab, desiredProfit: e.target.value })} placeholder="Ej: 1000" />
                </div>
                <div>
                  <Label hint="Análisis: impacto de bajar/subir el precio por unidad">Sensibilidad precio (±BS)</Label>
                  <input value={viab.priceSensitivityDelta} onChange={e => setViab({ ...viab, priceSensitivityDelta: e.target.value })} placeholder="Ej: 2" />
                </div>
                <div>
                  <Label hint="Análisis: impacto de bajar/subir el costo variable por unidad">Sensibilidad costo (±BS)</Label>
                  <input value={viab.costSensitivityDelta} onChange={e => setViab({ ...viab, costSensitivityDelta: e.target.value })} placeholder="Ej: 2" />
                </div>
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                <div>
                  <Label hint="Cuota mensual del crédito (si tienes un préstamo, ingresa la cuota aquí para que se considere en el análisis)">Cuota mensual del crédito (BS/mes) - Opcional</Label>
                  <input 
                    value={viab.monthlyLoanPayment} 
                    onChange={e => setViab({ ...viab, monthlyLoanPayment: e.target.value })} 
                    placeholder="Ej: 1332.73" 
                    type="number"
                    step="0.01"
                  />
                  <small className="muted">
                    💡 Si calculaste un préstamo en el Simulador de Crédito, puedes usar el botón "Usar cuota del simulador" para traerla automáticamente.
                  </small>
                </div>
              </div>
              <div className="actions">
                <button className="btn-primary" type="submit">Calcular</button>
              </div>
            </form>
            {viabResult && (
              <div style={{ marginTop: 16 }}>
                {(() => { return null; })()}
                {(() => {
                  const rubroName = (params.industry || '').trim() || 'Textil (poleras, blusas, pantalones, ropa deportiva)';
                  return (
                    <>
                      <h4>Resumen rápido del emprendimiento</h4>
                      <div className="section">
                        <div className="row">
                          <div><strong>Rubro:</strong> {rubroName}</div>
                          <div><strong>Capacidad mensual estimada:</strong> {Number(viab.expectedMonthlySalesUnits || 0).toLocaleString()} unidades</div>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              // Buscar la última simulación guardada y traer su cuota mensual
                              try {
                                const user = JSON.parse(localStorage.getItem('user') || '{}');
                                const userId = user.id || user.username || 'guest';
                                const key = `simulation_history_${userId}`;
                                const history = localStorage.getItem(key);
                                
                                if (history) {
                                  const simulations = JSON.parse(history);
                                  if (simulations.length > 0) {
                                    const lastSimulation = simulations[0]; // La más reciente
                                    if (lastSimulation.resultados?.cuotaMensual) {
                                      setViab(prev => ({
                                        ...prev,
                                        monthlyLoanPayment: String(lastSimulation.resultados.cuotaMensual.toFixed(2))
                                      }));
                                      alert(`✅ Cuota mensual del simulador cargada: Bs ${lastSimulation.resultados.cuotaMensual.toFixed(2)}\n\nAhora haz clic en "Calcular" para actualizar el análisis con esta cuota.`);
                                    } else {
                                      alert('⚠️ La última simulación no tiene cuota mensual calculada.');
                                    }
                                  } else {
                                    alert('⚠️ No hay simulaciones guardadas. Calcula primero un préstamo en el Simulador de Crédito.');
                                  }
                                } else {
                                  alert('⚠️ No hay simulaciones guardadas. Calcula primero un préstamo en el Simulador de Crédito.');
                                }
                              } catch (e) {
                                console.error('Error al cargar cuota del simulador:', e);
                                alert('❌ Error al cargar la cuota del simulador.');
                              }
                            }}
                            style={{ 
                              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '10px 20px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '13px'
                            }}
                          >
                            💰 Usar cuota del simulador
                          </button>
                          <button
                            className="btn-primary"
                            onClick={() => {
                              // Guardar datos del análisis para el simulador de crédito
                              const investmentAmount = viab.initialInvestment || viabResult.inputs.invest || 0;
                              const loanData = {
                                monto: String(investmentAmount),
                                // Calcular plazo sugerido basado en la utilidad mensual
                                plazo: '12',
                                tasaAnual: '12', // Tasa por defecto, el usuario puede ajustar
                                tipoCuota: 'fija',
                                // Guardar utilidad mensual para validaciones
                                utilidadMensual: viabResult.profitMonthly,
                                // Guardar flag para indicar que viene del análisis de viabilidad
                                fromViability: true
                              };
                              
                              console.log('Guardando datos para simulador:', loanData);
                              
                              // Guardar en localStorage
                              localStorage.setItem('loanDataFromViability', JSON.stringify(loanData));
                              
                              // Verificar que se guardó correctamente
                              const verify = localStorage.getItem('loanDataFromViability');
                              console.log('Verificación de guardado:', verify);
                              
                              // Pequeño delay antes de disparar el evento para asegurar que se guarde
                              setTimeout(() => {
                                // Disparar evento personalizado para que Dashboard cambie de sección
                                window.dispatchEvent(new CustomEvent('navigateToSimulator', { 
                                  detail: { section: 'simulador' } 
                                }));
                              }, 50);
                            }}
                            style={{ 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '12px 24px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}
                          >
                            💳 Calcular préstamo necesario
                          </button>
                          <button
                            onClick={() => {
                              // Guardar datos para Gestión de Ventas
                              const salesData = {
                                pricePerUnit: parseFloat(viab.pricePerUnit || '0'),
                                variableCostPerUnit: parseFloat(viab.variableCostPerUnit || '0'),
                                fixedCosts: parseFloat(viab.fixedCosts || '0'),
                                expectedMonthlySalesUnits: parseFloat(viab.expectedMonthlySalesUnits || '0'),
                                loanMonthlyPayment: parseFloat(viab.monthlyLoanPayment || '0'),
                                // Guardar flag para indicar que viene del análisis de viabilidad
                                fromViability: true
                              };
                              
                              console.log('Guardando datos para Gestión de Ventas:', salesData);
                              
                              // Guardar en localStorage
                              localStorage.setItem('salesDataFromViability', JSON.stringify(salesData));
                              
                              // Disparar evento personalizado para navegar a Gestión de Ventas
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('navigateToSales', { 
                                  detail: { section: 'ventas' } 
                                }));
                              }, 50);
                              
                              // Mostrar mensaje de éxito
                              alert('✅ Datos del análisis de viabilidad guardados. Serán usados al agregar ventas en Gestión de Ventas.');
                            }}
                            style={{ 
                              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '12px 24px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '14px',
                              marginLeft: '12px'
                            }}
                            title="Usar estos datos en Gestión de Ventas"
                          >
                            📊 Usar en Gestión de Ventas
                          </button>
                          <small className="muted" style={{ fontSize: '12px' }}>
                            {viabResult.monthlyLoanPayment > 0 
                              ? `💡 Cuota del crédito cargada: ${viabResult.monthlyLoanPayment.toLocaleString()} BS/mes. El análisis ya considera esta cuota.`
                              : `💡 PASO 1: Calcula un préstamo en el Simulador de Crédito primero. PASO 2: Usa "Usar cuota del simulador" para integrarla aquí.`
                            }
                          </small>
                        </div>
                      </div>
                    </>
                  );
                })()}
                <h4>Tabla de parámetros ingresados</h4>
                <table>
                  <thead>
                    <tr><th>Parámetro</th><th>Valor</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Costos fijos mensuales</td><td>{viabResult.inputs.fixedCosts.toLocaleString()} BS</td></tr>
                    <tr><td>Costo variable por prenda</td><td>{viabResult.inputs.vc.toLocaleString()} BS</td></tr>
                    <tr><td>Precio por prenda</td><td>{viabResult.inputs.price.toLocaleString()} BS</td></tr>
                    <tr><td>Ventas estimadas (u/mes)</td><td>{viabResult.inputs.units.toLocaleString()}</td></tr>
                    <tr><td>Inversión inicial</td><td>{viabResult.inputs.invest.toLocaleString()} BS</td></tr>
                    <tr><td>Meta de ganancia (mensual)</td><td>{viab.desiredProfit ? Number(viab.desiredProfit).toLocaleString() : 0} BS</td></tr>
                    {viabResult.monthlyLoanPayment > 0 && (
                      <tr style={{ background: '#fff3cd' }}>
                        <td><strong>Cuota mensual del crédito</strong></td>
                        <td><strong>{viabResult.monthlyLoanPayment.toLocaleString()} BS</strong></td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <h4>Cálculos principales (detalle)</h4>
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-title">Margen de contribución (BS/u)</div>
                    <div className="kpi-value">{viabResult.contrib.toLocaleString()}</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-title">Punto de equilibrio (unidades)</div>
                    <div className="kpi-value">{isFinite(viabResult.peUnits) ? Math.ceil(viabResult.peUnits).toLocaleString() : 'N/A'}</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-title">Punto de equilibrio (BS)</div>
                    <div className="kpi-value">{isFinite(viabResult.peRevenue) ? Math.ceil(viabResult.peRevenue).toLocaleString() : 'N/A'} BS</div>
                    {viabResult.monthlyLoanPayment > 0 && (
                      <small style={{ fontSize: '11px', color: '#666' }}>
                        Incluye cuota del crédito
                      </small>
                    )}
                  </div>
                </div>
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-title">Utilidad mensual del negocio</div>
                    <div className="kpi-value">{viabResult.profitMonthly.toLocaleString()} BS</div>
                    <small style={{ fontSize: '11px', color: '#666' }}>Antes de pagar el crédito</small>
                  </div>
                  {viabResult.monthlyLoanPayment > 0 && (
                    <div className="kpi-card" style={{ border: '2px solid #ff9800' }}>
                      <div className="kpi-title">Cuota mensual del crédito</div>
                      <div className="kpi-value" style={{ color: '#ff9800' }}>-{viabResult.monthlyLoanPayment.toLocaleString()} BS</div>
                    </div>
                  )}
                  <div className="kpi-card" style={{ 
                    background: viabResult.netProfitMonthly >= 0 ? '#e8f5e9' : '#ffebee',
                    border: `2px solid ${viabResult.netProfitMonthly >= 0 ? '#4caf50' : '#f44336'}`
                  }}>
                    <div className="kpi-title">💵 Utilidad neta mensual</div>
                    <div className="kpi-value" style={{ 
                      color: viabResult.netProfitMonthly >= 0 ? '#2e7d32' : '#c62828',
                      fontSize: '20px'
                    }}>
                      {viabResult.netProfitMonthly.toLocaleString()} BS
                    </div>
                    <small style={{ fontSize: '11px', color: '#666' }}>Después de pagar el crédito</small>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-title">Margen de ganancia</div>
                    <div className="kpi-value">{viabResult.profitMargin.toFixed(2)}%</div>
                    {viabResult.monthlyLoanPayment > 0 && (
                      <small style={{ fontSize: '11px', color: '#666' }}>
                        Margen neto: {viabResult.netProfitMargin.toFixed(2)}%
                      </small>
                    )}
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-title">ROI en {viabResult.months} meses</div>
                    <div className="kpi-value">{viabResult.roi.toFixed(2)}%</div>
                    <small style={{ fontSize: '11px', color: '#666' }}>Considerando el crédito</small>
                  </div>
                </div>
                {viabResult.monthlyLoanPayment > 0 && (
                  <div style={{ 
                    background: viabResult.netProfitMonthly >= 0 ? '#e8f5e9' : '#ffebee',
                    border: `2px solid ${viabResult.netProfitMonthly >= 0 ? '#4caf50' : '#f44336'}`,
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '12px'
                  }}>
                    <strong style={{ color: viabResult.netProfitMonthly >= 0 ? '#2e7d32' : '#c62828' }}>
                      {viabResult.netProfitMonthly >= 0 ? '✅' : '⚠️'} 
                      {' '}Análisis con crédito:
                    </strong>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                      Utilidad del negocio: <strong>{viabResult.profitMonthly.toLocaleString()} BS</strong><br/>
                      Menos cuota del crédito: <strong>-{viabResult.monthlyLoanPayment.toLocaleString()} BS</strong><br/>
                      <strong style={{ fontSize: '16px' }}>
                        Utilidad neta: {viabResult.netProfitMonthly.toLocaleString()} BS/mes
                      </strong>
                    </p>
                    {viabResult.netProfitMonthly < 0 && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#c62828' }}>
                        ⚠️ <strong>Advertencia:</strong> La cuota del crédito supera la utilidad del negocio. 
                        Considera ajustar el monto del préstamo, el plazo, o mejorar la rentabilidad del negocio.
                      </p>
                    )}
                  </div>
                )}
                <small className="muted">Interpretación: Si tus ventas superan el punto de equilibrio, el negocio es rentable. El ROI indica el retorno proporcional de tu inversión en el periodo seleccionado.</small>

                <h4>Escenarios simulados</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Escenario</th>
                      <th>Unidades</th>
                      <th>Ingresos (BS)</th>
                      <th>Costos variables (BS)</th>
                      <th>Costos totales (BS)</th>
                      <th>Utilidad (BS)</th>
                      {viabResult.monthlyLoanPayment > 0 && <th>Utilidad Neta (BS)</th>}
                      <th>Interpretación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viabResult.scenarios.map(s => (
                      <tr key={s.name}>
                        <td>{s.name}</td>
                        <td>{s.units.toLocaleString()}</td>
                        <td>{s.ingresos.toLocaleString()}</td>
                        <td>{s.costosVar.toLocaleString()}</td>
                        <td>{s.costosTot.toLocaleString()}</td>
                        <td>{s.utilidad.toLocaleString()}</td>
                        {viabResult.monthlyLoanPayment > 0 && (
                          <td style={{ 
                            color: s.utilidadNeta >= 0 ? '#2e7d32' : '#c62828',
                            fontWeight: 'bold'
                          }}>
                            {s.utilidadNeta.toLocaleString()}
                          </td>
                        )}
                        <td>
                          {viabResult.monthlyLoanPayment > 0 
                            ? (s.utilidadNeta >= 0 ? '✅ Rentable' : '❌ Pérdida')
                            : (s.utilidad >= 0 ? 'Rentable' : 'Pérdida')
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h4>Sensibilidades</h4>
                <div className="section">
                  <p><strong>Precio:</strong> Si bajas el precio {viab.priceSensitivityDelta} BS, utilidad ≈ {viabResult.sensitivity.priceDown.utilidad.toLocaleString()} BS; si lo subes {viab.priceSensitivityDelta} BS, utilidad ≈ {viabResult.sensitivity.priceUp.utilidad.toLocaleString()} BS.</p>
                  <p><strong>Costos:</strong> Si sube el costo variable {viab.costSensitivityDelta} BS, el punto de equilibrio pasa a {isFinite(viabResult.sensitivity.peCostUp) ? Math.ceil(viabResult.sensitivity.peCostUp).toLocaleString() : 'N/A'} prendas; si baja {viab.costSensitivityDelta} BS, sería {isFinite(viabResult.sensitivity.peCostDown) ? Math.ceil(viabResult.sensitivity.peCostDown).toLocaleString() : 'N/A'} prendas.</p>
                </div>

                {(() => {
                  const rubroName = (params.industry || '').trim() || 'Textil (poleras, blusas, pantalones, ropa deportiva)';
                  const isTextil = /textil|ropa|prenda|polera|blusa|pantal/i.test(rubroName);
                  return (
                    <>
                      <h4>Explicaciones con ejemplos {isTextil ? 'textiles' : `para ${rubroName}`}</h4>
                      <div className="section">
                        {isTextil ? (
                          <ul>
                            <li>Costo de tela por prenda, más hilo y cierres, suman el costo variable unitario.</li>
                            <li>Tiempo de costura por unidad y costo de estampado/bordado impactan tu costo variable.</li>
                            <li>Paquetes/Bolsas de empaque también se consideran en el costo variable.</li>
                            <li>Ejemplo: si la tela sube 5 BS por polera, tu punto de equilibrio puede pasar de 35 a ~39 prendas.</li>
                          </ul>
                        ) : (
                          <ul>
                            <li>Identifica insumos directos clave de {rubroName} y súmalos al costo variable unitario.</li>
                            <li>Incluye tiempos de producción/servicio y costos de tercerización si aplica.</li>
                            <li>Empaque, comisiones y logística también forman parte del costo variable.</li>
                            <li>Ejemplo: si un insumo sube 5 BS por unidad, el punto de equilibrio aumenta; recalcula para ver cuántas unidades adicionales necesitas vender.</li>
                          </ul>
                        )}
                      </div>
                    </>
                  );
                })()}

                <h4>Interpretación final</h4>
                <div className="section">
                  <p>
                    {viabResult.monthlyLoanPayment > 0 
                      ? (viabResult.netProfitMonthly >= 0 
                          ? 'El negocio es viable incluso considerando el pago del crédito.' 
                          : '⚠️ Con el crédito incluido, el negocio no es viable. La cuota del crédito supera la utilidad del negocio.')
                      : (viabResult.profitMonthly >= 0 
                          ? 'El negocio es viable bajo los supuestos actuales.' 
                          : 'Con los datos actuales, el negocio no es viable; ajusta precio, reduce costos o aumenta ventas.')
                    }
                  </p>
                  <p>
                    Debes producir y vender al menos {isFinite(viabResult.peUnits) ? Math.ceil(viabResult.peUnits).toLocaleString() : 'N/A'} prendas para no perder dinero. 
                    {viabResult.monthlyLoanPayment > 0 
                      ? ` Con tus ventas estimadas, la utilidad del negocio es ${viabResult.profitMonthly.toLocaleString()} BS mensuales, pero después de pagar el crédito (${viabResult.monthlyLoanPayment.toLocaleString()} BS), te quedan ${viabResult.netProfitMonthly.toLocaleString()} BS mensuales.`
                      : ` Con tus ventas estimadas, la ganancia esperada es ${viabResult.profitMonthly.toLocaleString()} BS mensuales.`
                    }
                  </p>
                  <p>Conviene subir precio si el mercado lo permite y si mejoras la propuesta de valor; conviene reducir costos buscando proveedores o mejorando eficiencia.</p>
                  {viabResult.monthlyLoanPayment > 0 && viabResult.netProfitMonthly < 0 && (
                    <p style={{ color: '#c62828', fontWeight: 'bold' }}>
                      💡 Recomendación: Considera reducir el monto del préstamo, aumentar el plazo, o mejorar la rentabilidad del negocio antes de solicitar el crédito.
                    </p>
                  )}
                </div>

                <h4>Recomendaciones prácticas</h4>
                <div className="section">
                  <ul>
                    <li>Negocia compras de tela al por mayor para reducir costos por prenda.</li>
                    <li>Optimiza tiempos de costura con estandarización de modelos.</li>
                    <li>Evalúa subir el precio en {viab.priceSensitivityDelta} BS si la demanda lo soporta.</li>
                    <li>Aplica promociones a productos con mayor margen (p. ej., ropa deportiva premium).</li>
                  </ul>
                </div>

                <h4>Conclusión de viabilidad</h4>
                <div className="section">
                  <p>
                    Con estos parámetros, {
                      viabResult.monthlyLoanPayment > 0
                        ? (viabResult.netProfitMonthly >= 0 
                            ? 'se recomienda avanzar y escalar gradualmente, considerando que el crédito es manejable.' 
                            : 'se recomienda ajustar la estrategia y recalcular antes de solicitar el crédito.')
                        : (viabResult.profitMonthly >= 0 
                            ? 'se recomienda avanzar y escalar gradualmente' 
                            : 'se recomienda ajustar la estrategia y recalcular')
                    } antes de invertir más capital.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default AIMentor;


