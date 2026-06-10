import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPublicServices } from '../services/api';
import heroImage from '../assets/hero.png';

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

const PublicHome = ({ isAuthenticated, currentUser, onLogout }) => {
  const [services, setServices] = useState([]);
  const [viewingDescription, setViewingDescription] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPublicServices = async () => {
      try {
        const data = await getPublicServices(6);
        setServices(data);
      } catch (error) {
        console.error('Error loading public services:', error);
      }
    };
    loadPublicServices();
  }, []);

  const handleRequestClick = () => {
    navigate(isAuthenticated ? '/app/marketplace' : '/login');
  };

  return (
    <div className="public-page">
      <nav className="public-nav">
        <Link to="/" className="brand-link">SISLIM</Link>
        <div className="public-nav-actions">
          {isAuthenticated ? (
            <>
              <span>Hola, {currentUser?.full_name}</span>
              <Link className="btn btn-secondary compact-btn" to="/app">Mi panel</Link>
              <button className="btn btn-danger compact-btn" onClick={onLogout}>Salir</button>
            </>
          ) : (
            <>
              <Link className="btn btn-danger compact-btn" to="/register">Registrarse</Link>
              <Link className="btn btn-secondary compact-btn" to="/login">Iniciar Sesion</Link>
            </>
          )}
        </div>
      </nav>

      <section className="home-hero">
        <img src={heroImage} alt="Servicio de limpieza SISLIM" className="home-hero-image" />
        <div className="home-hero-overlay">
          <div className="home-hero-content">
            <h1>SISLIM</h1>
            <p>Encuentra productos y servicios de limpieza ofrecidos por usuarios validados, solicita lo que necesitas y coordina con el ofertante desde la plataforma.</p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={handleRequestClick}>
                Buscar Productos y/o Servicios
              </button>
              {!isAuthenticated && (
                <Link className="btn btn-secondary" to="/register">
                  Crear Cuenta
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- Nueva sección: Cómo Funciona --- */}
      <section className="container">
        <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <h2>¿Cómo funciona SISLIM?</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>1. Explora el Catálogo</h3>
            <p>Descubre una variedad de productos y servicios de limpieza validados por nuestros administradores para garantizar la mejor calidad.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>2. Envía tu Solicitud</h3>
            <p>Contacta directamente al ofertante proponiendo una fecha, tu dirección y un mensaje con los detalles de lo que necesitas.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✨</div>
            <h3>3. Disfruta un Hogar Limpio</h3>
            <p>El ofertante confirmará la solicitud en su panel. Una vez aceptada, ¡todo estará listo para que disfrutes de un ambiente impecable!</p>
          </div>
        </div>
      </section>
      {/* ---------------------------------- */}

      <main className="container" style={{ paddingTop: '0' }}>
        <div className="section-header">
          <h2>Ofertas destacadas</h2>
          <button className="btn btn-secondary" onClick={handleRequestClick}>
            Ver catalogo completo
          </button>
        </div>

        <div className="offer-grid">
          {services.map((service) => (
            <article className="offer-card" key={service.id}>
              <div className="offer-card-header">
                <span>{service.category}</span>
                <strong>${service.price}</strong>
              </div>
              <h3>{service.title}</h3>
              <DescriptionPreview
                text={service.description}
                onView={() => setViewingDescription(service)}
              />
              <div className="offer-meta">
                <span>{service.provider_name}</span>
                <span>{service.request_count} solicitudes</span>
              </div>
              <button className="btn btn-primary" onClick={handleRequestClick}>
                Solicitar
              </button>
            </article>
          ))}
          {services.length === 0 && (
            <div className="card empty-offers">
              No hay ofertas aprobadas para mostrar todavia.
            </div>
          )}
        </div>
      </main>

      {/* --- Nuevo Footer --- */}
      <footer className="public-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h2>SISLIM</h2>
            <p>Tu plataforma de confianza para la limpieza y mantenimiento del hogar. Conectamos talento con necesidades reales.</p>
          </div>
          <div className="footer-links">
            <p>&copy; {new Date().getFullYear()} SISLIM. Todos los derechos reservados.</p>
            <p className="subtle-text" style={{ color: 'rgba(255,255,255,0.6)' }}>Proyecto de Prototipo de Gestión de Usuarios.</p>
          </div>
        </div>
      </footer>
      {/* -------------------- */}

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
    </div>
  );
};

export default PublicHome;
