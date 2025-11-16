import React, { useEffect, useRef, useState } from 'react';
import { userService } from '../services/api';
import './UserManagement.css';

const MyMentor = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [mentor, setMentor] = useState(user.mentor || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const endRef = useRef(null);
  const fileInputRef = useRef(null);
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
    if (!text.trim() && !selectedFile) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await userService.sendMessage(user.id, text.trim() || null, selectedFile);
      setText('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      const conv = await userService.listMessages(user.id);
      setMessages(conv.messages || []);
      setSuccess('Mensaje enviado');
      setTimeout(() => setSuccess(''), 2000);
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.oasis.opendocument.text'];
      const allowedExtensions = ['txt', 'pdf', 'doc', 'docx', 'odt'];
      const fileExt = file.name.split('.').pop().toLowerCase();
      
      if (!allowedExtensions.includes(fileExt)) {
        setError('Tipo de archivo no permitido. Solo se permiten: txt, pdf, doc, docx, odt');
        e.target.value = '';
        return;
      }
      
      // Validar tamaño (16 MB máximo)
      if (file.size > 16 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 16 MB');
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
      setError('');
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadFile = async (message) => {
    try {
      const blob = await userService.downloadFile(message.id, user.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.file_name || 'archivo';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo descargar el archivo');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
                  {msg.content && (
                    <div className="bubble-content">{msg.content}</div>
                  )}
                  {msg.file_name && (
                    <div className="file-attachment" style={{
                      marginTop: msg.content ? '8px' : '0',
                      padding: '8px',
                      backgroundColor: mine ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }} onClick={() => downloadFile(msg)}>
                      <span style={{ fontSize: '20px' }}>
                        {msg.file_type?.includes('pdf') ? '📄' : 
                         msg.file_type?.includes('word') || msg.file_name?.endsWith('.docx') || msg.file_name?.endsWith('.doc') ? '📝' : 
                         msg.file_name?.endsWith('.txt') ? '📃' : '📎'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{msg.file_name}</div>
                        {msg.file_size && (
                          <div style={{ fontSize: '12px', opacity: 0.8 }}>
                            {formatFileSize(msg.file_size)}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', opacity: 0.8 }}>⬇️</span>
                    </div>
                  )}
                  <div className="bubble-meta">{new Date(msg.created_at).toLocaleString()}</div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <form className="chat-input" onSubmit={send}>
            {selectedFile && (
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#e3f2fd',
                borderRadius: '6px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '20px' }}>
                    {selectedFile.name.endsWith('.pdf') ? '📄' : 
                     selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc') ? '📝' : 
                     selectedFile.name.endsWith('.txt') ? '📃' : '📎'}
                  </span>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{selectedFile.name}</span>
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px',
                    opacity: 0.7,
                  }}
                  title="Quitar archivo"
                >
                  ✕
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".txt,.pdf,.doc,.docx,.odt"
                style={{ display: 'none' }}
                id="file-input"
              />
              <label
                htmlFor="file-input"
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '40px',
                }}
                title="Adjuntar archivo (txt, pdf, doc, docx, odt)"
              >
                📎
              </label>
              <input
                placeholder="Escribe un mensaje para tu mentora..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-submit" disabled={loading || (!text.trim() && !selectedFile)}>
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
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


