import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TicketDetail from './components/TicketDetail';
import './styles/app.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('hotelflow_auth') === 'true'
  );

  const handleLogin = (email) => {
    localStorage.setItem('hotelflow_auth', 'true');
    localStorage.setItem('hotelflow_user', email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('hotelflow_auth');
    localStorage.removeItem('hotelflow_user');
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
      </Routes>
    </Router>
  );
}

export default App;
