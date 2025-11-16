import React, { useState, useEffect } from 'react';
import { biService } from '../services/api';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './BIModule.css';

const BIModule = () => {
  const [statistics, setStatistics] = useState(null);
  const [mentorPerformance, setMentorPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statsResponse, performanceResponse] = await Promise.all([
        biService.getStatistics(),
        biService.getMentorPerformance()
      ]);
      
      if (statsResponse.error) {
        setError(statsResponse.error);
      } else {
        setStatistics(statsResponse);
      }
      
      if (performanceResponse.error) {
        console.error('Error al cargar rendimiento de mentores:', performanceResponse.error);
      } else {
        setMentorPerformance(performanceResponse);
      }
    } catch (err) {
      setError('Error al cargar datos. Verifica que el backend esté corriendo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'];

  if (loading) {
    return <div className="bi-loading">Cargando datos de Business Intelligence...</div>;
  }

  if (error) {
    return <div className="bi-error">Error: {error}</div>;
  }

  if (!statistics) {
    return <div className="bi-error">No se pudieron cargar las estadísticas</div>;
  }

  const { overview, role_distribution, mentor_assignment, mentor_breakdown = [], monthly_users = [] } = statistics;

  return (
    <div className="bi-module">
      <div className="bi-header">
        <h2>Business Intelligence</h2>
        <button onClick={loadData} className="btn-refresh">
          🔄 Actualizar
        </button>
      </div>

      {/* Métricas principales */}
      <div className="bi-metrics">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-info">
            <h3>Total Usuarios</h3>
            <p className="metric-value">{overview.total_users}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">👤</div>
          <div className="metric-info">
            <h3>Administradores</h3>
            <p className="metric-value">{overview.total_admins}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🎓</div>
          <div className="metric-info">
            <h3>Mentores</h3>
            <p className="metric-value">{overview.total_mentors}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-info">
            <h3>Usuarios Regulares</h3>
            <p className="metric-value">{overview.total_users_role}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-info">
            <h3>Con Mentor</h3>
            <p className="metric-value">{overview.users_with_mentor}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⏳</div>
          <div className="metric-info">
            <h3>Sin Mentor</h3>
            <p className="metric-value">{overview.users_without_mentor}</p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="bi-charts">
        {/* Distribución por Rol */}
        <div className="chart-card">
          <h3>Distribución por Rol</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={role_distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ role, count }) => `${role}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {role_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Asignación de Mentores */}
        <div className="chart-card">
          <h3>Asignación de Mentores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mentor_assignment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count">
                {mentor_assignment.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Usuarios por Mentor */}
        {mentor_breakdown && mentor_breakdown.length > 0 && (
          <div className="chart-card">
            <h3>Usuarios por Mentor</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mentor_breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mentor" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#764ba2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Usuarios Creados por Mes */}
        {monthly_users && monthly_users.length > 0 && (
          <div className="chart-card">
            <h3>Usuarios Creados (Últimos 6 Meses)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthly_users}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#667eea" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabla de Rendimiento de Mentores */}
      {mentorPerformance && mentorPerformance.mentors.length > 0 && (
        <div className="bi-table-card">
          <h3>Rendimiento de Mentores</h3>
          <div className="table-container">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Mentor</th>
                  <th>Email</th>
                  <th>Usuarios Asignados</th>
                  <th>Rendimiento</th>
                </tr>
              </thead>
              <tbody>
                {mentorPerformance.mentors.map((mentor) => {
                  const maxUsers = Math.max(...mentorPerformance.mentors.map(m => m.assigned_users), 1);
                  const percentage = (mentor.assigned_users / maxUsers) * 100;
                  
                  return (
                    <tr key={mentor.mentor_id}>
                      <td>{mentor.mentor_name}</td>
                      <td>{mentor.email}</td>
                      <td>{mentor.assigned_users}</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${percentage}%` }}
                          >
                            {mentor.assigned_users}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BIModule;

