import React, { useState, useEffect } from 'react';
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
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Producto'
  });

  const loadServices = async () => {
    try {
      const data = await getServices();
      // Regular users only see their own services or approved ones.
      // But for this prototype we'll just show all and maybe filter visually.
      // Actually, let's filter:
      if (currentUser?.role === 'admin') {
        setServices(data);
      } else {
        setServices(data.filter(s => s.provider_id === currentUser.id || s.status === 'Aprobado'));
      }
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  useEffect(() => {
    loadServices();
  }, [currentUser]);

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
    if (window.confirm("¿Está seguro de que desea eliminar este servicio?")) {
      try {
        await deleteService(serviceId);
        loadServices();
      } catch (error) {
        console.error("Error deleting service:", error);
      }
    }
  };

  const handleStatusChange = async (serviceId, status) => {
    try {
      await updateServiceStatus(serviceId, status);
      loadServices();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("No se pudo actualizar el estado. Revise permisos.");
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
      console.error("Error saving service:", error);
      alert("Error al guardar el servicio");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Gestión de Servicios/Productos</h2>
        <button className="btn btn-secondary" onClick={handleAddService}>
          + Nuevo Servicio/Producto
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Descripción</th>
                <th>Precio</th>
                <th>Categoría</th>
                <th>Ofertante</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
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
                    <span style={{ 
                      color: service.status === 'Aprobado' ? 'green' : service.status === 'Rechazado' ? 'red' : 'orange', 
                      fontWeight: 'bold' 
                    }}>
                      {service.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '0.4rem', alignItems: 'center' }}>
                    {/* Ofertante options */}
                    {(currentUser?.id === service.provider_id || currentUser?.role === 'admin') && (
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
                    
                    {/* Admin options */}
                    {currentUser?.role === 'admin' && service.status === 'Pendiente' && (
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
              {services.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    No hay servicios o productos registrados.
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
            <h2>{editingService ? "Editar Servicio/Producto" : "Nuevo Servicio/Producto"}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Título:</label>
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
                <label>Descripción:</label>
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
                <label>Categoría:</label>
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

      {/* Description Modal */}
      {viewingDescription && (
        <div className="modal-overlay" onClick={() => setViewingDescription(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Descripción del {viewingDescription.category}</h2>
            <div style={{ 
              marginTop: '1rem', 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word', 
              maxHeight: '50vh', 
              overflowY: 'auto',
              padding: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}>
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
