import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [assigningUser, setAssigningUser] = useState(null);
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    loadUsers();
    loadMentors();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getAllUsers();
      if (response.error) {
        setError(response.error);
      } else {
        setUsers(response.users || []);
      }
    } catch (err) {
      setError('Error al cargar usuarios. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const loadMentors = async () => {
    try {
      const response = await adminService.getAllMentors();
      if (response.mentors) {
        setMentors(response.mentors || []);
      }
    } catch (err) {
      console.error('Error al cargar mentores:', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'user'
    });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (editingUser) {
        // Actualizar usuario
        const response = await adminService.updateUser(editingUser.id, formData);
        if (response.error) {
          setError(response.error);
        } else {
          setSuccess('Usuario actualizado correctamente');
          setShowModal(false);
          loadUsers();
        }
      } else {
        // Crear usuario
        if (!formData.password) {
          setError('La contraseña es obligatoria para crear usuarios');
          return;
        }
        const response = await adminService.createUser(formData);
        if (response.error) {
          setError(response.error);
        } else {
          setSuccess('Usuario creado correctamente');
          setShowModal(false);
          loadUsers();
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${username}"?`)) {
      return;
    }
    
    try {
      setError('');
      const response = await adminService.deleteUser(userId);
      if (response.error) {
        setError(response.error);
      } else {
        setSuccess(response.message || 'Usuario eliminado correctamente');
        loadUsers();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const handleAssignMentor = (user) => {
    setAssigningUser(user);
    setSelectedMentorId(user.mentor_id || '');
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const mentorId = selectedMentorId === '' ? null : parseInt(selectedMentorId);
      const response = await adminService.assignUserToMentor(assigningUser.id, mentorId);
      if (response.error) {
        setError(response.error);
      } else {
        setSuccess(response.message || 'Mentor asignado correctamente');
        setShowAssignModal(false);
        loadUsers();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al asignar mentor');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setShowAssignModal(false);
    setEditingUser(null);
    setAssigningUser(null);
    setSelectedMentorId('');
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'user'
    });
    setError('');
  };

  if (loading) {
    return <div className="loading">Cargando usuarios...</div>;
  }

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>Gestión de Usuarios</h2>
        <button onClick={handleCreate} className="btn-primary">
          + Crear Usuario
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Mentor</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-users">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.mentor ? user.mentor.username : '-'}
                  </td>
                  <td>
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>
                    {user.role === 'user' && (
                      <button
                        onClick={() => handleAssignMentor(user)}
                        className="btn-assign"
                        title="Asignar Mentor"
                      >
                        👤
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(user)}
                      className="btn-edit"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.username)}
                      className="btn-delete"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Editar Usuario' : 'Crear Usuario'}</h3>
              <button onClick={closeModal} className="btn-close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Usuario *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Contraseña {editingUser ? '(dejar vacío para no cambiar)' : '*'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Rol *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="user">Usuario</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Asignar Mentor</h3>
              <button onClick={() => setShowAssignModal(false)} className="btn-close">×</button>
            </div>
            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label htmlFor="user">Usuario</label>
                <input
                  type="text"
                  id="user"
                  value={assigningUser?.username || ''}
                  disabled
                />
              </div>

              <div className="form-group">
                <label htmlFor="mentor">Mentor</label>
                <select
                  id="mentor"
                  value={selectedMentorId}
                  onChange={(e) => setSelectedMentorId(e.target.value)}
                >
                  <option value="">Sin mentor</option>
                  {mentors.map((mentor) => (
                    <option key={mentor.id} value={mentor.id}>
                      {mentor.username} ({mentor.assigned_users_count || 0} usuarios)
                    </option>
                  ))}
                </select>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  Asignar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

