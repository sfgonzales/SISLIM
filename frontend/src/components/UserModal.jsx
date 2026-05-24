import React, { useState, useEffect } from 'react';
import { createUser, updateUser } from '../services/api';

const UserModal = ({ user, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'user',
    is_active: true
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        full_name: user.full_name,
        password: '', // Optional on edit
        role: user.role,
        is_active: user.is_active
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (user) {
        // Update
        const dataToUpdate = { ...formData };
        if (!dataToUpdate.password) {
          delete dataToUpdate.password;
        }
        await updateUser(user.id, dataToUpdate);
      } else {
        // Create
        if (!formData.password) {
          setError('La contraseña es requerida para un usuario nuevo.');
          return;
        }
        await createUser(formData);
      }
      onClose(true); // Close and refresh
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al procesar la solicitud.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{user ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
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
            <label>Correo Electrónico</label>
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
            <label>Contraseña {user && '(Dejar en blanco para no cambiar)'}</label>
            <input 
              type="password" 
              name="password" 
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              {...(!user ? { required: true } : {})}
            />
          </div>
          <div className="form-group">
            <label>Rol</label>
            <select 
              name="role" 
              className="form-control"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="user">Usuario Regular</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              name="is_active" 
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            <label htmlFor="is_active" style={{ marginBottom: 0 }}>Usuario Activo</label>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-danger" onClick={() => onClose(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-secondary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
