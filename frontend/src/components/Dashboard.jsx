import { useMemo, useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../services/api';
import UserModal from './UserModal';
import ServiceManagement from './ServiceManagement';
import RequestManagement from './RequestManagement';

const Dashboard = ({ onLogout, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');

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

  const filteredUsers = useMemo(() => {
    const query = userSearchTerm.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const searchableText = [
        user.id,
        user.full_name,
        user.email,
        user.role,
        user.is_active ? 'Activo' : 'Inactivo'
      ].join(' ').toLowerCase();

      return searchableText.includes(query);
    });
  }, [users, userSearchTerm]);

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
        <div className="section-header">
          <h2>Gestión de Usuarios</h2>
          <button className="btn btn-secondary" onClick={handleAddUser}>
            + Nuevo Usuario
          </button>
        </div>

        <div className="card">
          <div className="table-toolbar user-toolbar">
            <div>
              <label htmlFor="user-search">Buscar usuarios</label>
              <input
                type="search"
                id="user-search"
                className="form-control"
                placeholder="Nombre, correo, rol, estado..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
            </div>
            <button type="button" className="btn btn-danger service-clear-btn" onClick={() => setUserSearchTerm('')}>
              Limpiar
            </button>
          </div>

          <div className="table-meta">
            {filteredUsers.length} de {users.length} usuarios
          </div>

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
                {filteredUsers.map(user => (
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
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                      No hay usuarios para mostrar.
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

      <div className="container">
        <RequestManagement currentUser={currentUser} />
      </div>
    </div>
  );
};

export default Dashboard;
