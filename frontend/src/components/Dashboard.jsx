import React, { useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../services/api';
import UserModal from './UserModal';
import ServiceManagement from './ServiceManagement';

const Dashboard = ({ onLogout, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("¿Está seguro de que desea eliminar este usuario?")) {
      try {
        await deleteUser(userId);
        if (currentUser && currentUser.id === userId) {
          onLogout();
        } else {
          loadUsers();
        }
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleModalClose = (refresh = false) => {
    setIsModalOpen(false);
    if (refresh) {
      loadUsers();
    }
  };

  return (
    <div>
      <nav className="navbar">
        <h1>SISLIM - Dashboard</h1>
        <div>
          <span style={{ marginRight: '1rem' }}>Hola, {currentUser?.full_name}</span>
          <button onClick={onLogout} className="logout-btn">Cerrar Sesión</button>
        </div>
      </nav>

      <main className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>Gestión de Usuarios</h2>
          <button className="btn btn-secondary" onClick={handleAddUser}>
            + Nuevo Usuario
          </button>
        </div>

        <div className="card">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Completo</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span style={{ color: user.is_active ? 'green' : 'red', fontWeight: 'bold' }}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary" 
                        style={{ marginRight: '0.5rem', padding: '0.4rem 0.8rem' }}
                        onClick={() => handleEditUser(user)}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn btn-danger"
                        style={{ padding: '0.4rem 0.8rem' }}
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <UserModal 
          user={editingUser} 
          onClose={handleModalClose} 
        />
      )}
      
      {/* Services Management Section */}
      <div className="container">
        <ServiceManagement currentUser={currentUser} />
      </div>
    </div>
  );
};

export default Dashboard;
