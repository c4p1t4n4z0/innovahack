import React, { useEffect, useState } from 'react';
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

  const send = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!activeUser || !content) return;
    try {
      await mentorService.sendMessage(mentor.id, activeUser.id, content);
      setText('');
      const resp = await mentorService.listMessages(mentor.id, activeUser.id);
      setMessages(resp.messages || []);
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo enviar el mensaje');
    }
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
                  <div className="bubble-content">{m.content}</div>
                  <div className="bubble-meta">{new Date(m.created_at).toLocaleString()}</div>
                </div>
              );
            })}
          </div>
          <form className="chat-input" onSubmit={send}>
            <input placeholder="Escribe un mensaje..." value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn-submit" type="submit" disabled={!text.trim()}>Enviar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Emprendedoras;


