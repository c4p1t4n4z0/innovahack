import React, { useEffect, useState } from 'react';
import { userService, adminService } from '../services/api';
import './UserManagement.css';

const Overlay = ({ children, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const Section = ({ title, children, right }) => (
  <div className="profile-section">
    <div className="profile-section-header">
      <h3>{title}</h3>
      {right}
    </div>
    <div className="profile-section-body">{children}</div>
  </div>
);

const ProfileModal = ({ open, onClose }) => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [form, setForm] = useState({ username: storedUser.username || '', email: storedUser.email || '', password: '' });
  const [business, setBusiness] = useState({
    name: storedUser?.business?.name || '',
    category: storedUser?.business?.category || '',
    description: storedUser?.business?.description || '',
  });
  const [mentors, setMentors] = useState([]);
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const [profileResp, mentorsResp, invitesResp] = await Promise.all([
          userService.getProfile(storedUser.id),
          adminService.getAllMentors(),
          userService.listMyInvitations(storedUser.id),
        ]);
        const u = profileResp.user;
        setForm({ username: u.username, email: u.email, password: '' });
        setBusiness({
          name: u.business?.name || '',
          category: u.business?.category || '',
          description: u.business?.description || '',
        });
        setMentors(mentorsResp.mentors || []);
        setInvitations(invitesResp.invitations || []);
        localStorage.setItem('user', JSON.stringify(u));
      } catch {
        // noop
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const payload = { username: form.username, email: form.email };
      if (form.password) payload.password = form.password;
      const resp = await userService.updateProfile(storedUser.id, payload);
      setSuccess(resp.message || 'Perfil actualizado');
      localStorage.setItem('user', JSON.stringify(resp.user));
      setForm(f => ({ ...f, password: '' }));
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBusiness = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const resp = await userService.updateBusiness(storedUser.id, business);
      setSuccess(resp.message || 'Emprendimiento actualizado');
      localStorage.setItem('user', JSON.stringify(resp.user));
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar emprendimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMentor = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (!selectedMentorId) {
        setError('Seleccione un mentor');
        setLoading(false);
        return;
      }
      const resp = await userService.requestMentor(storedUser.id, parseInt(selectedMentorId), inviteMessage);
      setSuccess(resp.message || 'Invitación enviada');
      setInviteMessage('');
      const invitesResp = await userService.listMyInvitations(storedUser.id);
      setInvitations(invitesResp.invitations || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar invitación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div className="profile-modal">
        <div className="modal-header">
          <h2>Mi Perfil</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="profile-grid">
          <Section title="Datos de Perfil">
            <form className="form-compact" onSubmit={handleUpdateProfile}>
              <div className="form-row">
                <label>Usuario</label>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div className="form-row">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-row">
                <label>Nueva contraseña (opcional)</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Dejar en blanco para no cambiar" />
              </div>
              <div className="actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Perfil'}
                </button>
              </div>
            </form>
          </Section>

          <Section title="Mi Emprendimiento">
            <form className="form-compact" onSubmit={handleUpdateBusiness}>
              <div className="form-row">
                <label>Nombre</label>
                <input value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Categoría</label>
                <input value={business.category} onChange={(e) => setBusiness({ ...business, category: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Descripción</label>
                <textarea rows={3} value={business.description} onChange={(e) => setBusiness({ ...business, description: e.target.value })} />
              </div>
              <div className="actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Emprendimiento'}
                </button>
              </div>
            </form>
          </Section>

          <Section title="Mi Mentora">
            <form className="form-compact" onSubmit={handleRequestMentor}>
              <div className="form-row">
                <label>Seleccionar Mentor</label>
                <select value={selectedMentorId} onChange={(e) => setSelectedMentorId(e.target.value)}>
                  <option value="">Seleccione un mentor</option>
                  {mentors.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.username} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>Mensaje (opcional)</label>
                <textarea rows={2} value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)} placeholder="Cuéntale a tu mentora sobre tu emprendimiento..." />
              </div>
              <div className="actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Enviando...' : 'Solicitar Mentoría'}
                </button>
              </div>
            </form>
            <div className="invitations-list compact">
              <h4>Invitaciones Enviadas</h4>
              {invitations.length === 0 ? (
                <p className="muted">No tienes invitaciones.</p>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Mentor</th>
                      <th>Estado</th>
                      <th>Creada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map(inv => (
                      <tr key={inv.id}>
                        <td>{inv.id}</td>
                        <td>{inv.mentor?.username} ({inv.mentor?.email})</td>
                        <td>{inv.status}</td>
                        <td>{new Date(inv.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Section>
        </div>
      </div>
    </Overlay>
  );
};

export default ProfileModal;


