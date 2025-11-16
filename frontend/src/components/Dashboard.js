import React, { useState, useEffect } from 'react';
import UserManagement from './UserManagement';
import BIModule from './BIModule';
import MyUsers from './MyUsers';
import MentorInvitations from './MentorInvitations';
import MyMentor from './MyMentor';
import Emprendedoras from './Emprendedoras';
import AIMentor from './AIMentor';
import ProfileModal from './ProfileModal';
import CreditSimulator from './CreditSimulator';
import SimulationHistory from './SimulationHistory';
import ViabilityHistory from './ViabilityHistory';
import SalesManagement from './SalesManagement';
import './Dashboard.css';
import { userService } from '../services/api';

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [userUnread, setUserUnread] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Notificaciones de mensajes (usuario)
  useEffect(() => {
    let intervalId;
    const fetchUnread = async () => {
      if (user.role !== 'user') return;
      try {
        const r = await userService.getUnreadCount(user.id);
        setUserUnread(r.unread || 0);
      } catch {
        // ignore
      }
    };
    fetchUnread();
    if (user.role === 'user') {
      intervalId = setInterval(fetchUnread, 10000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user.role, user.id]);

  // Al abrir Mi Mentora, marcar leídos
  useEffect(() => {
    const handleMarkRead = async () => {
      if (user.role === 'user' && activeSection === 'mi-mentora' && userUnread > 0) {
        try {
          await userService.markMessagesRead(user.id);
          setUserUnread(0);
        } catch {
          // ignore
        }
      }
    };
    handleMarkRead();
  }, [activeSection, user.role, userUnread, user.id]);

  // Escuchar eventos personalizados para navegar entre secciones
  useEffect(() => {
    const handleNavigateToSimulator = (event) => {
      if (event.detail?.section === 'simulador') {
        // Pequeño delay para asegurar que los datos se guarden en localStorage
        setTimeout(() => {
          setActiveSection('simulador');
        }, 100);
      }
    };
    
    const handleNavigateToViability = (event) => {
      if (event.detail?.section === 'mi-mentora-ia') {
        setTimeout(() => {
          setActiveSection('mi-mentora-ia');
        }, 100);
      }
    };
    
    const handleNavigateToSales = (event) => {
      if (event.detail?.section === 'ventas') {
        setTimeout(() => {
          setActiveSection('ventas');
        }, 100);
      }
    };
    
    window.addEventListener('navigateToSimulator', handleNavigateToSimulator);
    window.addEventListener('navigateToViability', handleNavigateToViability);
    window.addEventListener('navigateToSales', handleNavigateToSales);
    
    return () => {
      window.removeEventListener('navigateToSimulator', handleNavigateToSimulator);
      window.removeEventListener('navigateToViability', handleNavigateToViability);
      window.removeEventListener('navigateToSales', handleNavigateToSales);
    };
  }, []);

  // Determinar menú según el rol del usuario
  const menuItems = [
    { id: 'usuarios', label: '👥 Gestión de Emprendedores', component: UserManagement, adminOnly: true },
    { id: 'bi', label: '📈 Business Intelligence', component: BIModule, adminOnly: true },
    { id: 'mis-usuarios', label: '👥 Mis Emprendedores Asignados', component: MyUsers, mentorOnly: true },
    { id: 'invitaciones', label: '✉️ Invitaciones', component: MentorInvitations, mentorOnly: true },
    { id: 'emprendedoras', label: '👩‍💼 Emprendedoras', component: Emprendedoras, mentorOnly: true },
    // Módulo del usuario: Mi Mentora y Simulador de Crédito (solo para emprendedores)
    ...(user.role === 'user' ? [{ id: 'mi-mentora', label: '🤝 Mi Mentora', component: MyMentor, adminOnly: false, mentorOnly: false }] : []),
    ...(user.role === 'user' ? [{ id: 'mi-mentora-ia', label: '🤖 Mi Mentora IA', component: AIMentor, adminOnly: false, mentorOnly: false }] : []),
    ...(user.role === 'user' ? [{ id: 'simulador', label: '💳 Simulador de Crédito', component: CreditSimulator, adminOnly: false, mentorOnly: false }] : []),
    ...(user.role === 'user' ? [{ id: 'historial-simulaciones', label: '📜 Historial Simulaciones', component: SimulationHistory, adminOnly: false, mentorOnly: false }] : []),
    ...(user.role === 'user' ? [{ id: 'historial-viabilidad', label: '📊 Historial Viabilidad', component: ViabilityHistory, adminOnly: false, mentorOnly: false }] : []),
    ...(user.role === 'user' ? [{ id: 'ventas', label: '📊 Gestión de Ventas', component: SalesManagement, adminOnly: false, mentorOnly: false }] : []),
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
            {user.role === 'user' && (
              <button className="btn-secondary" onClick={() => setProfileOpen(true)} title="Editar mi perfil">
                👤 Perfil
              </button>
            )}
            {user.role === 'user' && (
              <button
                className="btn-secondary"
                onClick={() => setActiveSection('mi-mentora')}
                title="Mensajes con mi mentora"
                style={{ position: 'relative', marginLeft: 8 }}
              >
                ✉️
                {userUnread > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      background: '#e53935',
                      color: '#fff',
                      borderRadius: 12,
                      padding: '2px 6px',
                      fontSize: 12,
                      fontWeight: 700,
                      lineHeight: 1
                    }}
                  >
                    {userUnread}
                  </span>
                )}
              </button>
            )}
            <div className="user-badge">
              <span className="user-name">{user.username}</span>
              <span className={`role-badge role-${user.role}`}>{user.role}</span>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          {renderContent()}
        </main>
        {user.role === 'user' && (
          <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;

