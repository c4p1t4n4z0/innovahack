import React, { useEffect, useRef, useState } from 'react';
import { userService } from '../services/api';
import './UserManagement.css';

const MyMentor = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [mentor, setMentor] = useState(user.mentor || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const endRef = useRef(null);
  const [view, setView] = useState('messages'); // 'messages' | 'program'
  const [industry, setIndustry] = useState(user?.business?.category || user?.business?.name || '');
  const [program, setProgram] = useState(null);

  const load = async () => {
    setError(''); setSuccess('');
    try {
      // refrescar perfil por si se asignó recientemente
      const prof = await userService.getProfile(user.id);
      setMentor(prof.user.mentor || null);
      localStorage.setItem('user', JSON.stringify(prof.user));
      if (prof.user.mentor) {
        const conv = await userService.listMessages(user.id);
        setMessages(conv.messages || []);
      } else {
        setMessages([]);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cargar datos');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await userService.sendMessage(user.id, text.trim());
      setText('');
      const conv = await userService.listMessages(user.id);
      setMessages(conv.messages || []);
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const generateProgram = () => {
    const ind = (industry || '').trim() || 'su industria';
    const bizName = user?.business?.name || '';
    const now = new Date();
    const today = now.toLocaleDateString();
    const p = {
      title: `Programa de Mentoría para Emprendedora en ${ind}`,
      date: today,
      businessName: bizName,
      sections: [
        {
          id: 'analisis',
          title: '1) Análisis detallado del negocio',
          bullets: [
            'Propuesta de valor y diferenciación frente a competidores',
            'Segmentos de clientes y buyer persona',
            'Canales de adquisición y conversión actuales',
            'Estructura de costos y principales proveedores',
            'Riesgos clave y supuestos críticos',
          ],
        },
        {
          id: 'metas',
          title: '2) Metas a corto y largo plazo',
          bullets: [
            'Corto plazo (0-3 meses): objetivos SMART de ventas y operaciones',
            'Mediano plazo (3-12 meses): expansión de canales y eficiencia',
            'Largo plazo (12-24 meses): crecimiento sostenible y posicionamiento',
            'Indicadores (KPI) y cadencia de revisión',
          ],
        },
        {
          id: 'finanzas',
          title: '3) Finanzas y flujo de caja',
          bullets: [
            'Proyección mensual de flujo de caja (ingresos, costos, gastos)',
            'Política de precios y márgenes por línea de producto/servicio',
            'Optimización de capital de trabajo (inventario, cuentas por cobrar/pagar)',
            'Plan de reducción de gastos no esenciales e inversiones prioritarias',
          ],
        },
        {
          id: 'mercado',
          title: '4) Presencia en el mercado',
          bullets: [
            'Estrategia de marca y mensajes clave para ${ind}',
            'Calendario de marketing: redes, contenido, eventos y alianzas',
            'Optimización de embudo digital (tráfico → leads → ventas)',
            'Sistema de referidos y programas de fidelización',
          ],
        },
        {
          id: 'liderazgo',
          title: '5) Liderazgo y gestión de equipo',
          bullets: [
            'Definición de roles y responsabilidades (RACI)',
            'Rituales de gestión: dailies, weeklies, retros, 1:1',
            'Formación en habilidades de liderazgo y comunicación',
            'Plan de atracción y retención de talento',
          ],
        },
        {
          id: 'seguimiento',
          title: '6) Plan de seguimiento y ajustes',
          bullets: [
            'Revisiones quincenales de KPIs y bloqueos',
            'Ciclos mensuales de hipótesis → experimentos → aprendizaje',
            'Reporte trimestral de avances y re-priorización',
            'Criterios de éxito y pivote',
          ],
        },
      ],
    };
    setProgram(p);
  };

  const copyProgram = async () => {
    if (!program) return;
    const textContent = [
      program.title,
      program.businessName ? `Negocio: ${program.businessName}` : '',
      `Fecha: ${program.date}`,
      '',
      ...program.sections.flatMap(s => [s.title, ...s.bullets.map(b => `- ${b.replace('${ind}', industry || 'su industria')}`), '']),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(textContent);
      setSuccess('Programa copiado al portapapeles');
      setTimeout(() => setSuccess(''), 1500);
    } catch {
      setError('No se pudo copiar el programa');
    }
  };

  if (!mentor) {
    return (
      <div className="user-management">
        <div className="management-header">
          <h2>Mi Mentora</h2>
        </div>
        <p className="no-users">Aún no tienes una mentora asignada. Envía una invitación desde tu Perfil.</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>Mi Mentora</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-secondary"
            onClick={() => setView('messages')}
            title="Mensajes"
          >
            ✉️ Mensajes
          </button>
          <button
            className="btn-secondary"
            onClick={() => setView('program')}
            title="Programa de Mentoría"
          >
            📝 Programa
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="users-table-container" style={{ marginBottom: 16 }}>
        <table className="users-table">
          <thead>
            <tr>
              <th>Mentora</th>
              <th>Email</th>
              <th>Asignada desde</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{mentor.username}</td>
              <td>{mentor.email}</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
      </div>

      {view === 'messages' && (
        <div className="chat-card">
          <div className="chat-messages">
            {messages.length === 0 && <div className="no-users">No hay mensajes aún</div>}
            {messages.map(msg => {
              const mine = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}>
                  <div className="bubble-content">{msg.content}</div>
                  <div className="bubble-meta">{new Date(msg.created_at).toLocaleString()}</div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <form className="chat-input" onSubmit={send}>
            <input
              placeholder="Escribe un mensaje para tu mentora..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="btn-submit" disabled={loading || !text.trim()}>
              Enviar
            </button>
          </form>
        </div>
      )}

      {view === 'program' && (
        <div className="profile-section">
          <div className="profile-section-header">
            <h3>Programa de Mentoría Personalizado</h3>
            <div className="actions">
              <button className="btn-secondary" onClick={generateProgram}>Generar</button>
              {program && <button className="btn-primary" onClick={copyProgram}>Copiar</button>}
            </div>
          </div>
          <div className="profile-section-body">
            <div className="form-compact">
              <div className="form-row">
                <label>Industria de la emprendedora</label>
                <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ej: Gastronomía, Moda, Tecnología..." />
              </div>
            </div>
            {!program && <p className="muted">Complete la industria y presione “Generar”.</p>}
            {program && (
              <div className="users-table-container">
                <div style={{ padding: 12 }}>
                  <h3 style={{ marginTop: 0 }}>{program.title}</h3>
                  {program.businessName && <p><strong>Negocio:</strong> {program.businessName}</p>}
                  <p><strong>Fecha:</strong> {program.date}</p>
                  {program.sections.map(sec => (
                    <div key={sec.id} style={{ marginTop: 12 }}>
                      <h4 style={{ margin: '8px 0' }}>{sec.title.replace('${ind}', industry || 'su industria')}</h4>
                      <ul>
                        {sec.bullets.map((b, idx) => (
                          <li key={idx}>{b.replace('${ind}', industry || 'su industria')}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMentor;


