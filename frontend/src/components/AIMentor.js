import React, { useState, useRef } from 'react';
import { aiService } from '../services/api';
import './UserManagement.css';

const Label = ({ children, hint }) => (
  <label title={hint}>{children}</label>
);

const AIMentor = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [params, setParams] = useState({
    industry: user?.business?.category || user?.business?.name || '',
    knowledgeLevel: 'básico', // básico | medio | avanzado
    businessStage: 'operando', // idea | prototipo | operando | escalando
    revenue: '',
    avgTicket: '',
    customersPerMonth: '',
    cashBufferMonths: '',
    mainChannels: 'redes sociales',
    teamSize: '1',
    goals: 'crecer ventas',
    timeframeMonths: '3',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [program, setProgram] = useState('');
  const [programHtml, setProgramHtml] = useState('');
  const dashboardRef = useRef(null);
  const [activeTab, setActiveTab] = useState('program'); // program | viability
  // Viabilidad y rentabilidad
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
    costSensitivityDelta: '2'            // +/- Bs para sensibilidad de costos
  });
  const [viabResult, setViabResult] = useState(null);
  const viabilityRef = useRef(null);
  // Generador de código de gráficos
  const [chartInputs, setChartInputs] = useState({
    title: 'Proyección de Ventas',
    labels: 'Enero,Febrero,Marzo,Abril',
    values: '1200,1500,1100,1800',
    chartType: 'bar', // bar | pie
    library: 'chartjs', // chartjs | matplotlib
    datasetLabel: 'Ventas (BS)'
  });
  const [chartCode, setChartCode] = useState('');

  const handle = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const generate = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setProgram('');
    try {
      const resp = await aiService.generateAIMentorProgram(params);
      const text = resp.program || 'No se obtuvo respuesta.';
      setProgram(text);
      // Crear una versión HTML estilizada (simple) sustituyendo títulos por bloques
      const lines = (text || '').split('\n');
      let html = '<div class="ai-program">';
      lines.forEach((line) => {
        const l = line.trim();
        if (!l) {
          html += '<div class="ai-spacer"></div>';
          return;
        }
        if (/^(nivel|introducción|análisis|establecimiento|toma|optimización|desarrollo|marketing|ampliación|evaluación|plan)/i.test(l)) {
          html += `<h4 class="ai-section">${l}</h4>`;
        } else if (/^[0-9]+\)/.test(l) || /^- /.test(l) || /^\* /.test(l)) {
          html += `<div class="ai-bullet">${l.replace(/^[-*]\s?/, '')}</div>`;
        } else if (/^##+/.test(l)) {
          html += `<h3 class="ai-subtitle">${l.replace(/^#+\s?/, '')}</h3>`;
        } else {
          html += `<p class="ai-text">${l}</p>`;
        }
      });
      html += '</div>';
      setProgramHtml(html);
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo generar el programa');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (!printWindow) return;
      const styles = `
        <style>
          body { font-family: Arial, sans-serif; color: #222; margin: 0; padding: 24px; }
          .ai-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
          .ai-title { margin: 0; font-size: 22px; }
          .ai-meta { color: #666; font-size: 12px; }
          .ai-program { border: 1px solid #eee; border-radius: 12px; padding: 16px; }
          .ai-section { margin: 16px 0 8px; font-size: 16px; color: #333; }
          .ai-subtitle { margin: 12px 0 6px; color: #444; }
          .ai-text { margin: 6px 0; line-height: 1.5; }
          .ai-bullet { position: relative; margin: 4px 0 4px 16px; }
          .ai-bullet:before { content: '•'; position: absolute; left: -12px; color: #7b61ff; }
          .ai-spacer { height: 8px; }
          @page { margin: 16mm; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      `;
      const meta = `
        <div class="ai-header">
          <h2 class="ai-title">Programa de Mentoría IA</h2>
          <div class="ai-meta">Industria: ${params.industry || '-'} • Objetivo: ${params.goals || '-'}</div>
        </div>
      `;
      printWindow.document.write(`<html><head><title>Mentora IA</title>${styles}</head><body>${meta}${programHtml || `<pre>${program}</pre>`}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } catch {
      alert('No se pudo exportar a PDF');
    }
  };

  const generateChartCode = (e) => {
    e.preventDefault();
    const title = (chartInputs.title || '').trim();
    const datasetLabel = (chartInputs.datasetLabel || '').trim() || 'Datos';
    const labels = (chartInputs.labels || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const values = (chartInputs.values || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(Number);
    if (!labels.length || !values.length || labels.length !== values.length) {
      alert('Verifica que etiquetas y valores tengan la misma cantidad y no estén vacíos.');
      return;
    }
    if (chartInputs.library === 'chartjs') {
      const type = chartInputs.chartType === 'pie' ? 'pie' : 'bar';
      const bgColors = chartInputs.chartType === 'pie'
        ? labels.map((_, i) => `rgba(${(i*47)%255}, ${(i*83)%255}, ${(i*131)%255}, 0.7)`)
        : 'rgba(123,97,255,0.7)';
      const borderColors = chartInputs.chartType === 'pie'
        ? labels.map((_, i) => `rgba(${(i*47)%255}, ${(i*83)%255}, ${(i*131)%255}, 1)`)
        : 'rgba(123,97,255,1)';
      const code = `<!-- Incluye Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<canvas id="myChart" width="600" height="320"></canvas>
<script>
  const ctx = document.getElementById('myChart').getContext('2d');
  const chart = new Chart(ctx, {
    type: '${type}',
    data: {
      labels: ${JSON.stringify(labels)},
      datasets: [{
        label: '${datasetLabel}',
        data: ${JSON.stringify(values)},
        backgroundColor: ${JSON.stringify(bgColors)},
        borderColor: ${JSON.stringify(borderColors)},
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: ${Boolean(title)},
          text: '${title.replace(/'/g, "\\'")}'
        },
        legend: { position: 'top' }
      },
      scales: ${type === 'bar' ? `{ y: { beginAtZero: true } }` : '{}'}
    }
  });
</script>`;
      setChartCode(code);
    } else {
      // matplotlib
      const code = `# Requiere: pip install matplotlib
import matplotlib.pyplot as plt

labels = ${JSON.stringify(labels)}
values = ${JSON.stringify(values)}

plt.figure(figsize=(8, 4))
${chartInputs.chartType === 'pie'
  ? `plt.pie(values, labels=labels, autopct='%1.1f%%', startangle=140)
plt.title('${title.replace(/'/g, "\\'")}')`
  : `plt.bar(labels, values, color='#7b61ff')
plt.title('${title.replace(/'/g, "\\'")}')
plt.ylabel('${datasetLabel.replace(/'/g, "\\'")}')
plt.grid(axis='y', linestyle='--', alpha=0.4)`}
plt.tight_layout()
plt.show()`;
      setChartCode(code);
    }
  };

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>Mi Mentora IA (Gemini)</h2>
      </div>
      <div className="tabs actions" style={{ gap: 8, marginBottom: 8 }}>
        <button
          className={`btn-secondary ${activeTab === 'program' ? 'active' : ''}`}
          onClick={() => setActiveTab('program')}
          title="Generar Programa con IA"
        >
          Programa
        </button>
        <button
          className={`btn-secondary ${activeTab === 'viability' ? 'active' : ''}`}
          onClick={() => setActiveTab('viability')}
          title="Análisis de viabilidad y rentabilidad"
        >
          Análisis de viabilidad y rentabilidad
        </button>
      </div>
      <div className="actions" style={{ justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          className="btn-secondary"
          onClick={() => {
            try {
              dashboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch {}
          }}
          title="Ver Dashboard Intelligence"
        >
          Gráfico
        </button>
      </div>
      {activeTab === 'program' && error && <div className="error-message">{error}</div>}
      {activeTab === 'program' && (
      <form className="form-compact" onSubmit={generate}>
        <div className="profile-section">
          <div className="profile-section-header">
            <h3>Parámetros de Negocio</h3>
          </div>
          <div className="profile-section-body">
            <div className="form-row">
              <Label hint="Sector o categoría del negocio (ej. Gastronomía, Moda, Tecnología)">Industria</Label>
              <input value={params.industry} onChange={e => handle('industry', e.target.value)} placeholder="Ej: Gastronomía" />
              <small className="muted">Cómo obtenerlo: define el sector donde compites y el subsegmento (ej: cafeterías artesanales).</small>
            </div>
            <div className="form-row">
              <Label hint="Conocimiento previo en IA para adaptar las recomendaciones">Nivel de conocimiento</Label>
              <select value={params.knowledgeLevel} onChange={e => handle('knowledgeLevel', e.target.value)}>
                <option>básico</option>
                <option>medio</option>
                <option>avanzado</option>
              </select>
              <small className="muted">Cómo obtenerlo: autoevalúa tu familiaridad con IA y datos (bajo/medio/alto).</small>
            </div>
            <div className="form-row">
              <Label hint="Etapa actual del negocio para priorizar acciones">Etapa del negocio</Label>
              <select value={params.businessStage} onChange={e => handle('businessStage', e.target.value)}>
                <option>idea</option>
                <option>prototipo</option>
                <option>operando</option>
                <option>escalando</option>
              </select>
              <small className="muted">Cómo obtenerlo: define si vendes activamente, validas prototipo o escalas.</small>
            </div>
            <div className="form-row">
              <Label hint="Ventas mensuales promedio">Ingresos mensuales (BS)</Label>
              <input value={params.revenue} onChange={e => handle('revenue', e.target.value)} placeholder="Ej: 5000" />
              <small className="muted">Cómo obtenerlo: suma ventas del último mes (o promedio de 3 meses).</small>
            </div>
            <div className="form-row">
              <Label hint="Valor promedio por venta">Ticket promedio (BS)</Label>
              <input value={params.avgTicket} onChange={e => handle('avgTicket', e.target.value)} placeholder="Ej: 25" />
              <small className="muted">Cómo obtenerlo: ingresos/ventas realizadas en el periodo.</small>
            </div>
            <div className="form-row">
              <Label hint="Número de clientes atendidos por mes">Clientes por mes</Label>
              <input value={params.customersPerMonth} onChange={e => handle('customersPerMonth', e.target.value)} placeholder="Ej: 200" />
              <small className="muted">Cómo obtenerlo: cuenta tickets o pedidos únicos del mes.</small>
            </div>
            <div className="form-row">
              <Label hint="Meses que puedes operar con tu caja actual">Caja de seguridad (meses)</Label>
              <input value={params.cashBufferMonths} onChange={e => handle('cashBufferMonths', e.target.value)} placeholder="Ej: 2" />
              <small className="muted">Cómo obtenerlo: efectivo disponible / gasto mensual fijo.</small>
            </div>
            <div className="form-row">
              <Label hint="Canales de adquisición y ventas actuales">Canales principales</Label>
              <input value={params.mainChannels} onChange={e => handle('mainChannels', e.target.value)} placeholder="Ej: Instagram, WhatsApp, Tienda física" />
              <small className="muted">Cómo obtenerlo: lista canales con mayor aporte a ventas.</small>
            </div>
            <div className="form-row">
              <Label hint="Número de integrantes del equipo (incluyéndote)">Tamaño de equipo</Label>
              <input value={params.teamSize} onChange={e => handle('teamSize', e.target.value)} placeholder="Ej: 3" />
              <small className="muted">Cómo obtenerlo: cuenta personas activas (propietaria + colaboradores).</small>
            </div>
            <div className="form-row">
              <Label hint="Qué quieres lograr en el periodo (ej: +30% ventas, reducir rotura de stock)">Objetivos</Label>
              <input value={params.goals} onChange={e => handle('goals', e.target.value)} placeholder="Ej: +30% ventas en 3 meses" />
              <small className="muted">Cómo obtenerlo: define metas SMART relevantes al negocio.</small>
            </div>
            <div className="form-row">
              <Label hint="Ventana de implementación del plan">Tiempo objetivo (meses)</Label>
              <input value={params.timeframeMonths} onChange={e => handle('timeframeMonths', e.target.value)} placeholder="Ej: 3" />
              <small className="muted">Cómo obtenerlo: periodo realista para ejecutar y medir.</small>
            </div>
          </div>
        </div>
        <div className="actions">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Generando...' : 'Generar Programa con IA'}
          </button>
        </div>
      </form>
      )}

      {activeTab === 'program' && program && (
        <div className="profile-section" style={{ marginTop: 16 }}>
          <div className="profile-section-header">
            <h3>Programa generado</h3>
            <div className="actions">
              <button
                className="btn-secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(program);
                    alert('Copiado al portapapeles');
                  } catch {
                    alert('No se pudo copiar');
                  }
                }}
              >
                Copiar
              </button>
              <button className="btn-primary" onClick={exportToPDF}>Exportar a PDF</button>
              <button
                className="btn-secondary"
                onClick={() => {
                  try {
                    dashboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } catch {}
                }}
                title="Ver Dashboard Intelligence"
              >
                Gráfico
              </button>
            </div>
          </div>
          <div className="profile-section-body ai-program-card">
            {programHtml ? (
              <div
                className="ai-program-content"
                dangerouslySetInnerHTML={{ __html: programHtml }}
              />
            ) : (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{program}</pre>
            )}
          </div>
        </div>
      )}

      {activeTab === 'program' && (
      <div className="profile-section" style={{ marginTop: 16 }} ref={dashboardRef}>
        <div className="profile-section-header">
          <h3>Dashboard Intelligence</h3>
        </div>
        <div className="profile-section-body">
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">Ingresos actuales</div>
              <div className="kpi-value">{Number(params.revenue || 0).toLocaleString()} BS</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Clientes/mes</div>
              <div className="kpi-value">{Number(params.customersPerMonth || 0).toLocaleString()}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Ticket promedio</div>
              <div className="kpi-value">{Number(params.avgTicket || 0).toLocaleString()} BS</div>
            </div>
          </div>
          <div className="bi-grid">
            <div className="bi-card">
              <canvas id="bi_revenue" height="220"></canvas>
            </div>
            <div className="bi-card">
              <canvas id="bi_customers" height="220"></canvas>
            </div>
            <div className="bi-card">
              <canvas id="bi_share" height="220"></canvas>
            </div>
          </div>
          <small className="muted">Nota: Proyección simple basada en tendencias (-10%, -5%, actual, +8%, +15%). Ajusta parámetros en el formulario superior para actualizar.</small>
        </div>
      </div>
      )}

      {activeTab === 'viability' && (
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
                const contrib = Math.max(0, price - vc);
                const peUnits = contrib > 0 ? fixedCosts / contrib : Infinity;
                const peRevenue = isFinite(peUnits) ? peUnits * price : Infinity;
                const revenue = units * price;
                const variable = units * vc;
                const profitMonthly = revenue - variable - fixedCosts;
                const profitMargin = revenue > 0 ? (profitMonthly / revenue) * 100 : 0;
                const profitPeriod = profitMonthly * months;
                const roi = invest > 0 ? (profitPeriod / invest) * 100 : 0;
                // Escenarios
                const mkScenario = (name, u) => {
                  const ing = u * price;
                  const varc = u * vc;
                  const util = ing - varc - fixedCosts;
                  return { name, units: u, ingresos: ing, costosVar: varc, costosTot: varc + fixedCosts, utilidad: util };
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
                const priceUp = mkScenario(`Precio +${dPrice} BS`, units);
                priceUp.ingresos = units * (price + dPrice);
                priceUp.utilidad = priceUp.ingresos - units * vc - fixedCosts;
                const peCostUp = contrib - dCost > 0 ? fixedCosts / (contrib - dCost) : Infinity;
                const peCostDown = contrib + dCost > 0 ? fixedCosts / (contrib + dCost) : Infinity;
                const res = {
                  contrib,
                  peUnits,
                  peRevenue,
                  profitMonthly,
                  profitMargin,
                  roi,
                  months,
                  scenarios: [realistic, optimal, pessimistic, goal],
                  sensitivity: {
                    priceDown: { delta: dPrice, utilidad: priceDown.utilidad },
                    priceUp: { delta: dPrice, utilidad: priceUp.utilidad },
                    peCostUp,
                    peCostDown
                  },
                  inputs: { fixedCosts, vc, price, units, invest, desiredProfit }
                };
                setViabResult(res);
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
                  </div>
                </div>
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-title">Utilidad mensual estimada</div>
                    <div className="kpi-value">{viabResult.profitMonthly.toLocaleString()} BS</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-title">Margen de ganancia</div>
                    <div className="kpi-value">{viabResult.profitMargin.toFixed(2)}%</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-title">ROI en {viabResult.months} meses</div>
                    <div className="kpi-value">{viabResult.roi.toFixed(2)}%</div>
                  </div>
                </div>
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
                        <td>{s.utilidad >= 0 ? 'Rentable' : 'Pérdida'}</td>
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
                  <p>{viabResult.profitMonthly >= 0 ? 'El negocio es viable bajo los supuestos actuales.' : 'Con los datos actuales, el negocio no es viable; ajusta precio, reduce costos o aumenta ventas.'}</p>
                  <p>Debes producir y vender al menos {isFinite(viabResult.peUnits) ? Math.ceil(viabResult.peUnits).toLocaleString() : 'N/A'} prendas para no perder dinero. Con tus ventas estimadas, la ganancia esperada es {viabResult.profitMonthly.toLocaleString()} BS mensuales.</p>
                  <p>Conviene subir precio si el mercado lo permite y si mejoras la propuesta de valor; conviene reducir costos buscando proveedores o mejorando eficiencia.</p>
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
                  <p>Con estos parámetros, {viabResult.profitMonthly >= 0 ? 'se recomienda avanzar y escalar gradualmente' : 'se recomienda ajustar la estrategia y recalcular'} antes de invertir más capital.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIMentor;


