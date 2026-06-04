import { useEffect, useState } from 'react';
import { getMyServiceRequests, getIncomingServiceRequests, updateServiceRequestStatus } from '../services/api';

const statusColor = (status) => {
  if (status === 'Aceptada') return 'green';
  if (status === 'Rechazada') return 'red';
  return 'orange';
};

const RequestManagement = ({ currentUser }) => {
  const [myRequests, setMyRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);

  const loadRequests = async () => {
    try {
      const [mine, incoming] = await Promise.all([
        getMyServiceRequests(),
        getIncomingServiceRequests()
      ]);
      setMyRequests(mine);
      setIncomingRequests(incoming);
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
                      <span style={{ color: statusColor(request.status), fontWeight: 'bold' }}>
                        {request.status}
                      </span>
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
                        <span className="subtle-text">{request.status}</span>
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
    </div>
  );
};

export default RequestManagement;
