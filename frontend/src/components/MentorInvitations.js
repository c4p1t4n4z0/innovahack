import React, { useEffect, useState } from 'react';
import { mentorService } from '../services/api';
import './UserManagement.css';

const MentorInvitations = () => {
  const mentor = JSON.parse(localStorage.getItem('user') || '{}');
  const [status, setStatus] = useState('pending');
  const [data, setData] = useState({ invitations: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadInvitations = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const resp = await mentorService.getInvitations(mentor.id, status);
      setData({ invitations: resp.invitations || [], total: resp.total || 0 });
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cargar invitaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const respond = async (invitationId, action) => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const resp = await mentorService.respondInvitation(mentor.id, invitationId, action);
      setSuccess(resp.message || 'Actualizado');
      await loadInvitations();
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo actualizar la invitación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>Invitaciones de Mentoría</h2>
        <div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Pendientes</option>
            <option value="">Todas</option>
            <option value="accepted">Aceptadas</option>
            <option value="rejected">Rechazadas</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      {loading && <div className="loading">Cargando...</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Emprendimiento</th>
              <th>Mensaje</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.invitations.length === 0 && (
              <tr>
                <td colSpan="7" className="no-users">Sin invitaciones</td>
              </tr>
            )}
            {data.invitations.map((inv) => {
              const b = inv.user?.business || {};
              return (
                <tr key={inv.id}>
                  <td>{inv.id}</td>
                  <td>{inv.user?.username}</td>
                  <td>{inv.user?.email}</td>
                  <td>
                    <div><strong>{b.name || '-'}</strong></div>
                    <div className="muted">{b.category || '-'}</div>
                    <div className="muted">{b.description || '-'}</div>
                  </td>
                  <td>{inv.message || '-'}</td>
                  <td>{inv.status}</td>
                  <td>
                    {inv.status === 'pending' ? (
                      <>
                        <button className="btn-submit" onClick={() => respond(inv.id, 'accept')}>Aceptar</button>
                        <button className="btn-cancel" onClick={() => respond(inv.id, 'reject')}>Rechazar</button>
                      </>
                    ) : (
                      <span className="muted">Sin acciones</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MentorInvitations;


