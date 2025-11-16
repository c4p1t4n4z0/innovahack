import React, { useState, useEffect } from 'react';
import UserManagement from './UserManagement';
import BIModule from './BIModule';
import MyUsers from './MyUsers';
import './Dashboard.css';

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Determinar sección inicial según el rol
  const getInitialSection = () => {
    if (user.role === 'mentor') {
      return 'mis-usuarios';
    }
    if (user.role === 'admin') {
      return 'usuarios';
    }
    return 'dashboard';
  };
  
  const [activeSection, setActiveSection] = useState(getInitialSection());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Determinar menú según el rol del usuario
  const menuItems = [
    { id: 'usuarios', label: '👥 Gestión de Usuarios', component: UserManagement, adminOnly: true },
    { id: 'bi', label: '📈 Business Intelligence', component: BIModule, adminOnly: true },
    { id: 'mis-usuarios', label: '👥 Mis Usuarios Asignados', component: MyUsers, mentorOnly: true },
    { id: 'dashboard', label: '📊 Dashboard', component: null, adminOnly: false, mentorOnly: false },
    // Puedes agregar más secciones aquí en el futuro
  ];

  const availableMenuItems = menuItems.filter(item => {
    // Si es solo para admin y el usuario no es admin, excluir
    if (item.adminOnly && user.role !== 'admin') {
      return false;
    }
    // Si es solo para mentor y el usuario no es mentor, excluir
    if (item.mentorOnly && user.role !== 'mentor') {
      return false;
    }
    return true;
  });

  // Asegurar que la sección activa esté disponible para el rol del usuario
  useEffect(() => {
    const isActiveSectionAvailable = availableMenuItems.some(item => item.id === activeSection);
    if (!isActiveSectionAvailable && availableMenuItems.length > 0) {
      setActiveSection(availableMenuItems[0].id);
    }
  }, [user.role]); // Solo ejecutar cuando cambie el rol

  const currentItem = availableMenuItems.find(item => item.id === activeSection) || menuItems.find(item => item.id === activeSection);
  const CurrentComponent = currentItem?.component;

  const renderContent = () => {
    if (!CurrentComponent) {
      return (
        <div className="welcome-section">
          <h2>Bienvenido, {user.username}</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👤</div>
              <div className="stat-info">
                <h3>Mi Perfil</h3>
                <p>{user.email}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔐</div>
              <div className="stat-info">
                <h3>Rol</h3>
                <p className={`role-text role-${user.role}`}>{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <CurrentComponent />;
  };

  return (
    <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-logo">Admin Panel</h2>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-menu">
            {availableMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <span className="nav-icon">{item.label.split(' ')[0]}</span>
                  {sidebarOpen && (
                    <span className="nav-label">{item.label.substring(item.label.indexOf(' ') + 1)}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="profile-avatar">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="profile-info">
                <p className="profile-name">{user.username}</p>
                <p className="profile-role">{user.role}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="btn-logout-sidebar">
            {sidebarOpen ? '🚪 Cerrar Sesión' : '🚪'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="mobile-menu-toggle" onClick={toggleSidebar}>
              ☰
            </button>
            <h1 className="page-title">
              {currentItem?.label.substring(currentItem.label.indexOf(' ') + 1) || 'Dashboard'}
            </h1>
          </div>
          <div className="header-right">
            <div className="user-badge">
              <span className="user-name">{user.username}</span>
              <span className={`role-badge role-${user.role}`}>{user.role}</span>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

