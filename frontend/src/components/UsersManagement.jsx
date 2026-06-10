import { useEffect, useMemo, useState } from 'react';
import { getUsers, deleteUser } from '../services/api';
import UserModal from './UserModal';

const UsersManagement = ({ currentUser, onLogout }) => {
  const [users, setUsers] = useState(() => {
    const saved = sessionStorage.getItem('usersList');
    return saved ? JSON.parse(saved) : [];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
      sessionStorage.setItem('usersList', JSON.stringify(data));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = userSearchTerm.trim().toLowerCase();
    if (!query) return users;

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

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Esta seguro de que desea eliminar este usuario?')) {
      try {
        await deleteUser(userId);
        if (currentUser && currentUser.id === userId) {
          onLogout();
        } else {
          loadUsers();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleModalClose = (refresh = false) => {
    setIsModalOpen(false);
    if (refresh) loadUsers();
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handlePageInput = (e) => {
    const value = e.target.value;
    if (value === '') {
      setCurrentPage('');
      return;
    }
    const pageNum = parseInt(value, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    } else if (!isNaN(pageNum) && pageNum >= 1) {
      setCurrentPage(totalPages);
    }
  };

  const getPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <button key="first" onClick={() => handlePageChange(1)} className="pagination-btn">
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="dots-start" className="pagination-dots">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="dots-end" className="pagination-dots">...</span>);
      }
      buttons.push(
        <button key="last" onClick={() => handlePageChange(totalPages)} className="pagination-btn">
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  return (
    <>
      <div className="section-header">
        <h2>Gestion de Usuarios</h2>
        <button className="btn btn-secondary" onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
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
              {paginatedUsers.map((user) => (
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
                      className="btn btn-primary compact-btn"
                      style={{ marginRight: '0.5rem' }}
                      onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                    >
                      Editar
                    </button>
                    <button className="btn btn-danger compact-btn" onClick={() => handleDeleteUser(user.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    {filteredUsers.length === 0 ? 'No hay usuarios para este filtro.' : 'No hay usuarios para mostrar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination-container">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ← Anterior
            </button>

            <div className="pagination-buttons">
              {getPaginationButtons()}
            </div>

            <div className="pagination-input-group">
              <label htmlFor="page-input-users">Ir a página:</label>
              <input
                id="page-input-users"
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={handlePageInput}
                className="form-control"
                style={{ width: '60px', textAlign: 'center' }}
              />
              <span className="pagination-info">de {totalPages}</span>
            </div>

            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <UserModal
          user={editingUser}
          onClose={handleModalClose}
        />
      )}
    </>
  );
};

export default UsersManagement;