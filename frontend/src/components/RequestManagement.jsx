import { useEffect, useState } from 'react';
import { getMyServiceRequests, getIncomingServiceRequests, updateServiceRequestStatus, createServiceReview } from '../services/api';

const statusColor = (status) => {
  if (status === 'Aceptada') return 'green';
  if (status === 'Rechazada') return 'red';
  return 'orange';
};

const RequestManagement = ({ currentUser }) => {
  const [myRequests, setMyRequests] = useState(() => {
    const saved = sessionStorage.getItem('myRequestsList');
    return saved ? JSON.parse(saved) : [];
  });
  const [incomingRequests, setIncomingRequests] = useState(() => {
    const saved = sessionStorage.getItem('incomingRequestsList');
    return saved ? JSON.parse(saved) : [];
  });

  const [reviewModal, setReviewModal] = useState({ open: false, request: null });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  const loadRequests = async () => {
    try {
      const [mine, incoming] = await Promise.all([
        getMyServiceRequests(),
        getIncomingServiceRequests()
      ]);
      setMyRequests(mine);
      setIncomingRequests(incoming);
      sessionStorage.setItem('myRequestsList', JSON.stringify(mine));
      sessionStorage.setItem('incomingRequestsList', JSON.stringify(incoming));
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadRequests();
    }
  }, [currentUser]);

  const handleRequestStatus = async (requestId, status) => {
    try {
      await updateServiceRequestStatus(requestId, status);
      await loadRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      alert('No se pudo actualizar la solicitud.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await createServiceReview({
        service_id: reviewModal.request.service_id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment
      });
      alert('¡Gracias por tu reseña! La calificación ha sido guardada.');
      setReviewModal({ open: false, request: null });
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al enviar reseña, tal vez ya lo calificaste.');
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="section-header">
        <div>
          <h2>Solicitudes</h2>
          <p className="subtle-text">Aquí puedes revisar tus pedidos y administrar las solicitudes entrantes si ofreces productos o servicios.</p>
        </div>
      </div>

      <div className="request-grid">
        <div className="card">
          <div className="section-header compact-header">
            <h3>Mis Solicitudes</h3>
            <span className="table-meta">{myRequests.length} registradas</span>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Producto/Servicio</th>
                  <th>Ofertante</th>
                  <th>Fecha deseada</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.service_title}</td>
                    <td>{request.provider_name}</td>
                    <td>{request.requested_date || '-'}</td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ color: statusColor(request.status), fontWeight: 'bold' }}>
                          {request.status}
                        </span>
                        {request.status === 'Aceptada' && (
                          <button 
                            className="btn btn-secondary compact-btn"
                            onClick={() => {
                              setReviewForm({ rating: 5, comment: '' });
                              setReviewModal({ open: true, request });
                            }}>
                            Calificar ⭐
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {myRequests.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                      Todavía no realizaste solicitudes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-header compact-header">
            <h3>Solicitudes Recibidas</h3>
            <span className="table-meta">{incomingRequests.filter((request) => request.status === 'Pendiente').length} pendientes de {incomingRequests.length}</span>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Producto/Servicio</th>
                  <th>Demandante</th>
                  <th>Datos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {incomingRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.service_title}</td>
                    <td>{request.requester_name}</td>
                    <td>
                      <div>{request.message}</div>
                      <div className="subtle-text">{request.contact_phone || 'Sin teléfono'} / {request.address || 'Sin dirección'}</div>
                    </td>
                    <td>
                      <span style={{ color: statusColor(request.status), fontWeight: 'bold' }}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      {request.status === 'Pendiente' ? (
                        <div className="row-actions">
                          <button className="btn btn-secondary compact-btn" onClick={() => handleRequestStatus(request.id, 'Aceptada')}>
                            Aceptar
                          </button>
                          <button className="btn btn-danger compact-btn" onClick={() => handleRequestStatus(request.id, 'Rechazada')}>
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="subtle-text" style={{ fontSize: '1.2rem' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {incomingRequests.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                      No tienes solicitudes recibidas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {reviewModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setReviewModal({ open: false, request: null })}>×</button>
            <h2>Calificar Oferta</h2>
            <p className="subtle-text">Califica tu experiencia con <strong>{reviewModal.request?.service_title}</strong></p>
            
            <form onSubmit={handleReviewSubmit} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>Calificación (Estrellas)</label>
                <select 
                  className="form-control" 
                  value={reviewForm.rating} 
                  onChange={(e) => setReviewForm({...reviewForm, rating: e.target.value})}
                  required
                >
                  <option value="5">⭐⭐⭐⭐⭐ - Excelente</option>
                  <option value="4">⭐⭐⭐⭐ - Muy Bueno</option>
                  <option value="3">⭐⭐⭐ - Regular</option>
                  <option value="2">⭐⭐ - Malo</option>
                  <option value="1">⭐ - Pésimo</option>
                </select>
              </div>

              <div className="form-group">
                <label>Comentarios (Opcional)</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                  placeholder="Cuéntanos cómo fue el servicio..."
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Enviar Reseña
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestManagement;
