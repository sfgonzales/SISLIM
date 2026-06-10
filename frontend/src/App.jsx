import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicHome from './components/PublicHome';
import Login from './components/Login';
import Register from './components/Register';
import AppShell from './components/AppShell';
import DashboardHome from './components/DashboardHome';
import UsersManagement from './components/UsersManagement';
import ServiceManagement from './components/ServiceManagement';
import ApprovalManagement from './components/ApprovalManagement';
import RequestManagement from './components/RequestManagement';
import Marketplace from './components/Marketplace';
import { getCurrentUser } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token') && !!localStorage.getItem('currentUser');
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(!localStorage.getItem('currentUser') && !!localStorage.getItem('token'));

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = await getCurrentUser();
          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('currentUser', JSON.stringify(user));
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } else {
        localStorage.removeItem('currentUser');
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const refreshCurrentUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const protectedPage = (children) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return (
      <AppShell currentUser={currentUser} onLogout={handleLogout}>
        {children}
      </AppShell>
    );
  };

  if (loading) {
    return <div className="loading-screen">Cargando...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <PublicHome
              isAuthenticated={isAuthenticated}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          }
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/app" replace /> : <Login onLoginSuccess={refreshCurrentUser} />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/app" replace /> : <Register onRegisterSuccess={refreshCurrentUser} />}
        />
        <Route
          path="/app"
          element={protectedPage(<DashboardHome currentUser={currentUser} />)}
        />
        <Route
          path="/app/marketplace"
          element={protectedPage(<Marketplace currentUser={currentUser} />)}
        />
        <Route
          path="/app/requests"
          element={protectedPage(<RequestManagement currentUser={currentUser} />)}
        />
        <Route
          path="/app/services"
          element={protectedPage(<ServiceManagement currentUser={currentUser} />)}
        />
        <Route
          path="/app/users"
          element={
            currentUser?.role === 'admin'
              ? protectedPage(<UsersManagement currentUser={currentUser} onLogout={handleLogout} />)
              : <Navigate to="/app" replace />
          }
        />
        <Route
          path="/app/approval"
          element={
            currentUser?.role === 'admin'
              ? protectedPage(<ApprovalManagement currentUser={currentUser} />)
              : <Navigate to="/app" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
