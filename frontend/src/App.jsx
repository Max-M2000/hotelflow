import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TicketDetail from './components/TicketDetail';
import Routing from './components/Routing';
import Reports from './components/Reports';
import Settings from './components/Settings';
import EmailSetup from './components/EmailSetup';
import Users from './components/Users';
import { TOKEN_KEY } from './services/api';
import './styles/app.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem(TOKEN_KEY)
  );

  const handleLogin = ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    if (user && user.email) localStorage.setItem('hotelflow_user', user.email);
    if (user && user.name) localStorage.setItem('hotelflow_name', user.name);
    if (user && user.role) localStorage.setItem('hotelflow_role', user.role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('hotelflow_auth');
    localStorage.removeItem('hotelflow_user');
    localStorage.removeItem('hotelflow_name');
    localStorage.removeItem('hotelflow_role');
    setIsAuthenticated(false);
  };

  const requireAuth = (element) =>
    isAuthenticated ? (
      <Layout onLogout={handleLogout}>{element}</Layout>
    ) : (
      <Navigate to="/login" />
    );

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />}
        />
        <Route path="/" element={requireAuth(<Dashboard />)} />
        <Route path="/ticket/:id" element={requireAuth(<TicketDetail />)} />
        <Route path="/routing" element={requireAuth(<Routing />)} />
        <Route path="/reports" element={requireAuth(<Reports />)} />
        <Route path="/settings" element={requireAuth(<Settings />)} />
        <Route path="/einrichtung" element={requireAuth(<EmailSetup />)} />
        <Route path="/users" element={requireAuth(<Users />)} />
      </Routes>
    </Router>
  );
}

export default App;
