import { NavLink, Link } from 'react-router-dom';

const AppShell = ({ currentUser, onLogout, children }) => {
  return (
    <div>
      <nav className="navbar app-navbar">
        <Link to="/" className="app-brand">✨ SISLIM 🫧</Link>
        <div className="app-nav-links">
          <NavLink to="/app" end>Panel</NavLink>
          <NavLink to="/app/marketplace">Catálogo</NavLink>
          <NavLink to="/app/requests">Solicitudes</NavLink>
          <NavLink to="/app/services">Mis Ofertas</NavLink>
          {currentUser?.role === 'admin' && <NavLink to="/app/users">Usuarios</NavLink>}
          {currentUser?.role === 'admin' && <NavLink to="/app/approval">Aprobación</NavLink>}
        </div>
        <div className="app-user-actions">
          <span>Hola, {currentUser?.full_name}</span>
          <button onClick={onLogout} className="logout-btn">Cerrar Sesion</button>
        </div>
      </nav>
      <main className="container">
        {children}
      </main>
    </div>
  );
};

export default AppShell;
