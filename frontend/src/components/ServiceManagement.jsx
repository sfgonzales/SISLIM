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
  const [services, setServices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [viewingDescription, setViewingDescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
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

  const filteredServices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return services.filter((service) => {
      const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
      const matchesProvider = providerFilter === 'all' || String(service.provider_id) === providerFilter;
      const searchableText = [
        service.title,
        service.description,
        service.category,
        service.status,
        service.provider_name,
        String(service.price)
      ].join(' ').toLowerCase();

      return matchesCategory && matchesStatus && matchesProvider && (!query || searchableText.includes(query));
    });
  }, [services, searchTerm, categoryFilter, statusFilter, providerFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setProviderFilter('all');
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

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="section-header">
        <h2>Gestion de Servicios/Productos</h2>
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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="service-filter">
            <label htmlFor="category-filter">Categoria</label>
            <select
              id="category-filter"
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
            <label htmlFor="status-filter">Estado</label>
            <select
              id="status-filter"
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>

          {isAdmin && (
            <div className="service-filter">
              <label htmlFor="provider-filter">Ofertante</label>
              <select
                id="provider-filter"
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
          )}

          <button type="button" className="btn btn-danger service-clear-btn" onClick={clearFilters}>
            Limpiar
          </button>
        </div>

        <div className="table-meta">
          {isAdmin ? 'Vista de administrador: todos los registros' : 'Mostrando solo tus registros'} - {filteredServices.length} de {services.length}
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
                <th>Ofertante</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
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
                  <td>{service.provider_name}</td>
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
                      {(currentUser?.id === service.provider_id || isAdmin) && (
                        <>
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
                        </>
                      )}

                      {isAdmin && service.status === 'Pendiente' && (
                        <>
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
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    No hay servicios o productos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
