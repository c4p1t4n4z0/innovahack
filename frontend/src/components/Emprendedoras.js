import React, { useEffect, useState, useRef } from 'react';
import { mentorService } from '../services/api';
import './UserManagement.css';

const Emprendedoras = () => {
  const mentor = JSON.parse(localStorage.getItem('user') || '{}');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const resp = await mentorService.getConversations(mentor.id);
      setConversations(resp.conversations || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cargar emprendedoras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openChat = async (user) => {
    setActiveUser(user);
    try {
      await mentorService.markMessagesRead(mentor.id, user.id);
      const resp = await mentorService.listMessages(mentor.id, user.id);
      setMessages(resp.messages || []);
      // también refrescar conteos
      load();
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!activeUser || (!text.trim() && !selectedFile)) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await mentorService.sendMessage(mentor.id, activeUser.id, text.trim() || null, selectedFile);
      setText('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      const resp = await mentorService.listMessages(mentor.id, activeUser.id);
      setMessages(resp.messages || []);
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
      const blob = await mentorService.downloadFile(message.id, mentor.id);
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

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>Emprendedoras</h2>
      </div>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      {loading && <div className="loading">Cargando...</div>}

      <div className="users-table-container" style={{ marginBottom: 16 }}>
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Mensajes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {conversations.length === 0 && (
              <tr>
                <td colSpan="4" className="no-users">No tienes emprendedoras asignadas.</td>
              </tr>
            )}
            {conversations.map((c) => (
              <tr key={c.user.id}>
                <td>{c.user.username}</td>
                <td>{c.user.email}</td>
                <td>
                  {c.unread_count > 0 ? (
                    <span title="Mensajes no leídos">📩 {c.unread_count}</span>
                  ) : (
                    <span className="muted">✉️ 0</span>
                  )}
                </td>
                <td>
                  <button className="btn-primary" onClick={() => openChat(c.user)}>
                    Mensajes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeUser && (
        <div className="chat-card">
          <div className="management-header" style={{ padding: '12px 12px 0 12px' }}>
            <h3>Chat con {activeUser.username}</h3>
            <button className="btn-cancel" onClick={() => setActiveUser(null)}>Cerrar</button>
          </div>
          <div className="chat-messages">
            {messages.length === 0 && <div className="no-users">No hay mensajes</div>}
            {messages.map((m) => {
              const mine = m.sender_id === mentor.id;
              return (
                <div key={m.id} className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}>
                  {m.content && (
                    <div className="bubble-content">{m.content}</div>
                  )}
                  {m.file_name && (
                    <div className="file-attachment" style={{
                      marginTop: m.content ? '8px' : '0',
                      padding: '8px',
                      backgroundColor: mine ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }} onClick={() => downloadFile(m)}>
                      <span style={{ fontSize: '20px' }}>
                        {m.file_type?.includes('pdf') ? '📄' : 
                         m.file_type?.includes('word') || m.file_name?.endsWith('.docx') || m.file_name?.endsWith('.doc') ? '📝' : 
                         m.file_name?.endsWith('.txt') ? '📃' : '📎'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{m.file_name}</div>
                        {m.file_size && (
                          <div style={{ fontSize: '12px', opacity: 0.8 }}>
                            {formatFileSize(m.file_size)}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', opacity: 0.8 }}>⬇️</span>
                    </div>
                  )}
                  <div className="bubble-meta">{new Date(m.created_at).toLocaleString()}</div>
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
                id="file-input-mentor"
              />
              <label
                htmlFor="file-input-mentor"
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
                placeholder="Escribe un mensaje..." 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn-submit" type="submit" disabled={loading || (!text.trim() && !selectedFile)}>
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Emprendedoras;


