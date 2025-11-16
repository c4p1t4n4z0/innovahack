import React, { useState, useEffect } from 'react';
import { mentorService } from '../services/api';
import './MyUsers.css';

const MyUsers = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user.id) {
      loadUsers();
    }
  }, [user.id]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await mentorService.getMyUsers(user.id);
      if (response.error) {
        setError(response.error);
      } else {
        setUsers(response.users || []);
      }
    } catch (err) {
      setError('Error al cargar usuarios. Verifica que el backend esté corriendo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await mentorService.getMyUser(user.id, userId);
      if (response.error) {
        setError(response.error);
      } else {
        setSelectedUser(response);
        setShowModal(true);
      }
    } catch (err) {
      setError('Error al cargar información del usuario.');
      console.error(err);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  if (loading) {
    return <div className="my-users-loading">Cargando usuarios asignados...</div>;
  }

  if (error) {
    return (
      <div className="my-users-error">
        <p>Error: {error}</p>
        <button onClick={loadUsers} className="btn-retry">
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="my-users">
      <div className="my-users-header">
        <h2>Mis Usuarios Asignados</h2>
        <button onClick={loadUsers} className="btn-refresh">
          🔄 Actualizar
        </button>
      </div>

      {users.length === 0 ? (
        <div className="my-users-empty">
          <p>No tienes usuarios asignados actualmente.</p>
        </div>
      ) : (
        <>
          <div className="my-users-stats">
            <div className="stat-card">
              <h3>Total de Usuarios</h3>
              <p className="stat-value">{users.length}</p>
            </div>
          </div>

          <div className="my-users-table-container">
            <table className="my-users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Fecha de Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
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
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewUser(user.id)}
                        className="btn-view"
                      >
                        👁️ Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles del Usuario</h3>
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="user-detail">
                <label>ID:</label>
                <p>{selectedUser.id}</p>
              </div>
              <div className="user-detail">
                <label>Usuario:</label>
                <p>{selectedUser.username}</p>
              </div>
              <div className="user-detail">
                <label>Email:</label>
                <p>{selectedUser.email}</p>
              </div>
              <div className="user-detail">
                <label>Rol:</label>
                <p>
                  <span className={`role-badge role-${selectedUser.role}`}>
                    {selectedUser.role}
                  </span>
                </p>
              </div>
              <div className="user-detail">
                <label>Fecha de Registro:</label>
                <p>
                  {selectedUser.created_at
                    ? new Date(selectedUser.created_at).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeModal} className="btn-close">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyUsers;

