import { useEffect, useMemo, useState } from 'react';
import { getServices, updateServiceStatus } from '../services/api';

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

const ApprovalManagement = ({ currentUser }) => {
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [viewingDescription, setViewingDescription] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const loadServices = async () => {
    try {
      const data = await getServices();
      setServices(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadServices();
    }
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

  const pendingServices = useMemo(() => {
    return services.filter((service) => service.status === 'Pendiente');
  }, [services]);

  const filteredServices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return pendingServices.filter((service) => {
      const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
      const matchesProvider = providerFilter === 'all' || String(service.provider_id) === providerFilter;
      const searchableText = [
        service.title,
        service.description,
        service.category,
        service.provider_name,
        String(service.price)
      ].join(' ').toLowerCase();

      return matchesCategory && matchesProvider && (!query || searchableText.includes(query));
    });
  }, [pendingServices, searchTerm, categoryFilter, providerFilter]);

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, startIndex + itemsPerPage);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setProviderFilter('all');
  };

  const handleStatusChange = async (serviceId, status) => {
    try {
      await updateServiceStatus(serviceId, status);
      await loadServices();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('No se pudo actualizar el estado.');
    }
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
      // Mostrar la última página si excede el máximo
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

  if (currentUser?.role !== 'admin') {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', minHeight: '200px', display: 'grid', placeContent: 'center' }}>
          <p>Solo los administradores pueden acceder a este panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="section-header">
        <div>
          <h2>Aprobación de Productos/Servicios</h2>
          <p className="subtle-text">Revisa y aprueba o rechaza los productos y servicios pendientes de otros usuarios.</p>
        </div>
      </div>

      <div className="card">
        <div className="service-toolbar">
          <div className="service-search">
            <label htmlFor="approval-search">Buscar</label>
            <input
              type="search"
              id="approval-search"
              className="form-control"
              placeholder="Titulo, descripcion, proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="service-filter">
            <label htmlFor="approval-category">Categoría</label>
            <select
              id="approval-category"
              className="form-control"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="Producto">Producto</option>
              <option value="Servicio">Servicio</option>
            </select>
          </div>

          <div className="service-filter">
            <label htmlFor="approval-provider">Proveedor</label>
            <select
              id="approval-provider"
              className="form-control"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="btn btn-danger service-clear-btn" onClick={clearFilters}>
            Limpiar
          </button>
        </div>

        <div className="table-meta">
          {filteredServices.length} de {pendingServices.length} servicios pendientes de aprobación
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Descripción</th>
                <th>Precio</th>
                <th>Categoría</th>
                <th>Proveedor</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedServices.map((service) => (
                <tr key={service.id}>
                  <td>{service.title}</td>
                  <td style={{ maxWidth: '250px' }}>
                    <DescriptionCell
                      text={service.description}
                      onView={() => setViewingDescription(service)}
                    />
                  </td>
                  <td>${service.price}</td>
                  <td>{service.category}</td>
                  <td>{service.provider_name}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap' }}>
                      <button
                        className="btn"
                        style={{ backgroundColor: '#219ebc', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => handleStatusChange(service.id, 'Aprobado')}
                      >
                        Aprobar
                      </button>
                      <button
                        className="btn"
                        style={{ backgroundColor: '#fb8500', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => handleStatusChange(service.id, 'Rechazado')}
                      >
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedServices.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    {filteredServices.length === 0 ? 'No hay servicios pendientes para esta búsqueda.' : 'No hay servicios pendientes.'}
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
              <label htmlFor="page-input">Ir a página:</label>
              <input
                id="page-input"
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

      {viewingDescription && (
        <div className="modal-overlay" onClick={() => setViewingDescription(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Descripción del {viewingDescription.category}</h2>
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

export default ApprovalManagement;
