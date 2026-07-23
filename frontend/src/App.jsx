import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './components/Dashboard';
import TicketDetail from './components/TicketDetail';
import './styles/app.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('hotelflow_auth') === 'true';
  });

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

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/ticket/:id"
          element={
            isAuthenticated ? <TicketDetail /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
