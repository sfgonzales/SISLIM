import { useEffect, useMemo, useState } from 'react';
import { getServices, createService, updateService, deleteService, updateServiceStatus } from '../services/api';

const DescriptionCell = ({ text, onView }) => {
  const maxLength = 100;

  if (!text) return <span>-</span>;

  if (text.length <= maxLength) {
    return <span style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{text}</span>;
  }

  return (
    <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
      <span>{text.substring(0, maxLength)}...</span>
      <button
        onClick={onView}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--secondary)',
          cursor: 'pointer',
          marginLeft: '5px',
          textDecoration: 'underline',
          fontSize: '0.85rem',
          padding: 0
        }}
      >
        Leer todo
      </button>
    </div>
  );
};

const ServiceManagement = ({ currentUser }) => {
  const [services, setServices] = useState(() => {
    const saved = sessionStorage.getItem('myServicesList');
    return saved ? JSON.parse(saved) : [];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [viewingDescription, setViewingDescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Producto'
  });

  const isAdmin = currentUser?.role === 'admin';

  const loadServices = async () => {
    try {
      const data = await getServices();
      setServices(data);
      sessionStorage.setItem('myServicesList', JSON.stringify(data));
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  useEffect(() => {
    loadServices();
  }, [currentUser]);

  const providers = useMemo(() => {
    const uniqueProviders = new Map();
    services.forEach((service) => {
      if (service.provider_id && service.provider_name) {
        uniqueProviders.set(String(service.provider_id), service.provider_name);
      }
    });
    return Array.from(uniqueProviders, ([id, name]) => ({ id, name }));
  }, [services]);

  const myServices = useMemo(() => {
    return services.filter((service) => service.provider_id === currentUser?.id);
  }, [services, currentUser]);

  const filteredServices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return myServices.filter((service) => {
      const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
      const searchableText = [
        service.title,
        service.description,
        service.category,
        service.status,
        String(service.price)
      ].join(' ').toLowerCase();

      return matchesCategory && matchesStatus && (!query || searchableText.includes(query));
    });
  }, [myServices, searchTerm, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, startIndex + itemsPerPage);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handleAddService = () => {
    setEditingService(null);
    setFormData({ title: '', description: '', price: '', category: 'Producto' });
    setIsModalOpen(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description,
      price: service.price,
      category: service.category
    });
    setIsModalOpen(true);
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Esta seguro de que desea eliminar este servicio?')) {
      try {
        await deleteService(serviceId);
        loadServices();
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  const handleStatusChange = async (serviceId, status) => {
    try {
      await updateServiceStatus(serviceId, status);
      loadServices();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('No se pudo actualizar el estado. Revise permisos.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (editingService) {
        await updateService(editingService.id, data);
      } else {
        await createService(data);
      }
      setIsModalOpen(false);
      loadServices();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error al guardar el servicio');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    <div style={{ marginTop: '2rem' }}>
      <div className="section-header">
        <div>
          <h2>Mis Ofertas</h2>
          <p className="subtle-text">Administra tus productos y servicios, actualiza su estado y visualiza su historial.</p>
        </div>
        <button className="btn btn-secondary" onClick={handleAddService}>
          + Nuevo Servicio/Producto
        </button>
      </div>

      <div className="card">
        <div className="service-toolbar">
          <div className="service-search">
            <label htmlFor="service-search">Buscar</label>
            <input
              type="search"
              id="service-search"
              className="form-control"
              placeholder="Titulo, descripcion, precio..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="service-filter">
            <label htmlFor="category-filter">Categoría</label>
            <select
              id="category-filter"
              className="form-control"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Todas</option>
              <option value="Producto">Producto</option>
              <option value="Servicio">Servicio</option>
            </select>
          </div>

          <div className="service-filter">
            <label htmlFor="status-filter">Estado</label>
            <select
              id="status-filter"
              className="form-control"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>

          <button type="button" className="btn btn-danger service-clear-btn" onClick={clearFilters}>
            Limpiar
          </button>
        </div>

        <div className="table-meta">
          {filteredServices.length} de {myServices.length} ofertas
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Titulo</th>
                <th>Descripcion</th>
                <th>Precio</th>
                <th>Categoria</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedServices.map((service) => (
                <tr key={service.id}>
                  <td>{service.id}</td>
                  <td>{service.title}</td>
                  <td style={{ maxWidth: '250px' }}>
                    <DescriptionCell
                      text={service.description}
                      onView={() => setViewingDescription(service)}
                    />
                  </td>
                  <td>${service.price}</td>
                  <td>{service.category}</td>
                  <td>
                    <span
                      style={{
                        color: service.status === 'Aprobado' ? 'green' : service.status === 'Rechazado' ? 'red' : 'orange',
                        fontWeight: 'bold'
                      }}
                    >
                      {service.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => handleEditService(service)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => handleDeleteService(service.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedServices.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    {filteredServices.length === 0 ? 'No hay servicios para este filtro.' : 'No hay servicios o productos para mostrar.'}
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
              <label htmlFor="page-input-service">Ir a página:</label>
              <input
                id="page-input-service"
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingService ? 'Editar Servicio/Producto' : 'Nuevo Servicio/Producto'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Titulo:</label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripcion:</label>
                <textarea
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio:</label>
                <input
                  type="number"
                  name="price"
                  className="form-control"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoria:</label>
                <select
                  name="category"
                  className="form-control"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="Producto">Producto</option>
                  <option value="Servicio">Servicio</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Guardar
                </button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingDescription && (
        <div className="modal-overlay" onClick={() => setViewingDescription(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Descripcion del {viewingDescription.category}</h2>
            <div
              style={{
                marginTop: '1rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '50vh',
                overflowY: 'auto',
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}
            >
              {viewingDescription.description}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setViewingDescription(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;
