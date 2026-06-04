import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUser, login } from '../services/api';

const Register = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUser({
        ...formData,
        role: 'user',
        is_active: true
      });
      const tokenData = await login(formData.email, formData.password);
      localStorage.setItem('token', tokenData.access_token);
      await onRegisterSuccess();
      navigate('/app');
    } catch (err) {
      localStorage.removeItem('token');
      setError(err.response?.data?.detail || 'No se pudo crear la cuenta.');
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <h2>Crear Cuenta</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              name="full_name"
              className="form-control"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Correo Electronico</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Contrasena</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Registrarme
          </button>
        </form>
        <p className="auth-switch">
          Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
