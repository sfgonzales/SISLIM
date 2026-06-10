import { Link } from 'react-router-dom';

const DashboardHome = ({ currentUser }) => {
  return (
    <>
      <div className="section-header">
        <div>
          <h2>Bienvenido al panel de SISLIM</h2>
          <p className="subtle-text">Usa las secciones separadas para explorar ofertas, gestionar tus solicitudes y administrar tus servicios.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <Link className="dashboard-card" to="/app/marketplace">
          <span>Catálogo</span>
          <h3>Explorar ofertas</h3>
          <p>Revisa productos y servicios aprobados, haz búsquedas por categoría y solicita lo que necesitas.</p>
        </Link>

        <Link className="dashboard-card" to="/app/requests">
          <span>Solicitudes</span>
          <h3>Mis pedidos y respuesta</h3>
          <p>Observa tus solicitudes activas y responde a los interesados cuando ofreces servicios.</p>
        </Link>

        <Link className="dashboard-card" to="/app/services">
          <span>Ofertas</span>
          <h3>Mis productos y servicios</h3>
          <p>Crea nuevas ofertas, actualiza descripciones y monitorea el estado de tus publicaciones.</p>
        </Link>

        {currentUser?.role === 'admin' && (
          <>
            <Link className="dashboard-card" to="/app/users">
              <span>Administrador</span>
              <h3>Gestión de usuarios</h3>
              <p>Crea, edita y controla cuentas. Solo los administradores pueden acceder aquí.</p>
            </Link>
            <Link className="dashboard-card" to="/app/approval">
              <span>Administrador</span>
              <h3>Aprobación de ofertas</h3>
              <p>Revisa y aprueba o rechaza los servicios y productos publicados por los usuarios.</p>
            </Link>
          </>
        )}
      </div>
    </>
  );
};

export default DashboardHome;
