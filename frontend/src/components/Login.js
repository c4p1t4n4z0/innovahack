import React, { useState } from 'react';
import { authService } from '../services/api';
import './Login.css';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegister) {
        // Validaciones de registro
        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
          setError('Todos los campos son obligatorios');
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }

        const response = await authService.register(
          formData.username,
          formData.email,
          formData.password
        );

        if (response.error) {
          setError(response.error);
        } else {
          setSuccess('Emprendedor registrado correctamente. Ahora puedes iniciar sesión.');
          setIsRegister(false);
          setFormData({
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
          });
        }
      } else {
        // Login
        if (!formData.username || !formData.password) {
          setError('Nombre de usuario y contraseña son obligatorios');
          setLoading(false);
          return;
        }

        const response = await authService.login(
          formData.username,
          formData.password
        );

        if (response.error) {
          setError(response.error);
        } else {
          setSuccess('Login exitoso');
          // Aquí guardarías el token y redirigirías
          if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
            // En producción, aquí guardarías el token JWT
            // localStorage.setItem('token', response.token);
            setTimeout(() => {
              // Redirigir al Dashboard
              window.location.href = '/dashboard';
            }, 1000);
          }
        }
      }
    } catch (err) {
      if (err.response) {
        // Error del servidor
        setError(err.response.data?.error || 'Error del servidor');
      } else if (err.request) {
        // Error de red
        setError('No se pudo conectar al servidor. Verifica que el backend esté corriendo en http://localhost:5000');
      } else {
        // Otro error
        setError('Error inesperado. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setSuccess('');
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-card">
        <h2>{isRegister ? 'Registro' : 'Iniciar Sesión'}</h2>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nombre de usuario"
              required
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Contraseña"
              required
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirma tu contraseña"
                required
              />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="toggle-mode">
          <p>
            {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <button type="button" onClick={toggleMode} className="link-button">
              {isRegister ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
