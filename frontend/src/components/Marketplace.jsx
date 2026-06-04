import { useEffect, useState } from 'react';
import { searchMarketplaceServices, createServiceRequest } from '../services/api';

const DescriptionPreview = ({ text, onView }) => {
  const maxLength = 80;

  if (!text) return <span>-</span>;

  if (text.length <= maxLength) {
    return <p>{text}</p>;
  }

  return (
    <div>
      <p>{text.substring(0, maxLength)}...</p>
      <button
        onClick={onView}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--secondary)',
          cursor: 'pointer',
          textDecoration: 'underline',
          fontSize: '0.9rem',
          padding: 0,
          marginTop: '0.5rem'
        }}
      >
        Ver más
      </button>
    </div>
  );
};

const Marketplace = ({ currentUser }) => {
  const [offers, setOffers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortMode, setSortMode] = useState('recent');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [viewingDescription, setViewingDescription] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [requestForm, setRequestForm] = useState({
    message: '',
    requested_date: '',
    address: '',
    contact_phone: ''
  });
  const [loading, setLoading] = useState(false);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await searchMarketplaceServices({
        q: searchTerm,
        category: categoryFilter,
        sort: sortMode
      });
      setOffers(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading marketplace:', error);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadOffers();
    }
  }, [currentUser, searchTerm, categoryFilter, sortMode]);

  const totalPages = Math.ceil(offers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOffers = offers.slice(startIndex, startIndex + itemsPerPage);

  const clearSearch = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSortMode('recent');
  };

  const openRequestModal = (offer) => {
    setSelectedOffer(offer);
    setRequestForm({
      message: '',
      requested_date: '',
      address: '',
      contact_phone: ''
    });
  };

  const handleRequestChange = (e) => {
    const { name, value } = e.target;
    setRequestForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await createServiceRequest({
        ...requestForm,
        service_id: selectedOffer.id,
        requested_date: requestForm.requested_date || null
      });
      setSelectedOffer(null);
      await loadOffers();
      alert('Solicitud registrada correctamente.');
    } catch (error) {
      console.error('Error creating request:', error);
      alert(error.response?.data?.detail || 'No se pudo registrar la solicitud.');
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
          <h2>Catálogo de ofertas</h2>
          <p className="subtle-text">Busca productos y servicios habilitados en la plataforma y solicita lo que necesites.</p>
        </div>
      </div>

      <div className="card">
        <div className="service-toolbar">
          <div className="service-search">
            <label htmlFor="catalog-search">Buscar en el catálogo</label>
            <input
              type="search"
              id="catalog-search"
              className="form-control"
              placeholder="Titulo, descripcion, proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="service-filter">
            <label htmlFor="catalog-category">Categoria</label>
            <select
              id="catalog-category"
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
            <label htmlFor="catalog-sort">Ordenar</label>
            <select
              id="catalog-sort"
              className="form-control"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
            >
              <option value="recent">Mas recientes</option>
              <option value="most_requested">Mas solicitados</option>
              <option value="best_rated">Mejor calificados</option>
            </select>
          </div>

          <button type="button" className="btn btn-danger service-clear-btn" onClick={clearSearch}>
            Limpiar filtros
          </button>
        </div>

        <div className="offer-grid">
          {loading ? (
            <div className="card empty-offers">Cargando ofertas...</div>
          ) : paginatedOffers.length > 0 ? (
            paginatedOffers.map((offer) => (
              <article className="offer-card" key={offer.id}>
                <div className="offer-card-header">
                  <span>{offer.category}</span>
                  <strong>${offer.price}</strong>
                </div>
                <h3>{offer.title}</h3>
                <DescriptionPreview
                  text={offer.description}
                  onView={() => setViewingDescription(offer)}
                />
                <div className="offer-meta">
                  <span>{offer.provider_name}</span>
                  <span>{offer.request_count} solicitudes</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openRequestModal(offer)}
                  disabled={currentUser?.role === 'admin'}
                >
                  {currentUser?.role === 'admin' ? 'No disponible para admin' : 'Solicitar'}
                </button>
              </article>
            ))
          ) : (
            <div className="card empty-offers">No se encontraron ofertas para estos filtros.</div>
          )}
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
              <label htmlFor="page-input-marketplace">Ir a página:</label>
              <input
                id="page-input-marketplace"
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
            <h2>Descripción de {viewingDescription.category}</h2>
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

      {selectedOffer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Solicitar {selectedOffer.title}</h2>
            <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Mensaje para el ofertante</label>
                <textarea
                  name="message"
                  className="form-control"
                  value={requestForm.message}
                  onChange={handleRequestChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Fecha deseada</label>
                <input
                  type="date"
                  name="requested_date"
                  className="form-control"
                  value={requestForm.requested_date}
                  onChange={handleRequestChange}
                />
              </div>
              <div className="form-group">
                <label>Dirección o zona</label>
                <input
                  type="text"
                  name="address"
                  className="form-control"
                  value={requestForm.address}
                  onChange={handleRequestChange}
                />
              </div>
              <div className="form-group">
                <label>Teléfono de contacto</label>
                <input
                  type="text"
                  name="contact_phone"
                  className="form-control"
                  value={requestForm.contact_phone}
                  onChange={handleRequestChange}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Enviar solicitud
                </button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedOffer(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
