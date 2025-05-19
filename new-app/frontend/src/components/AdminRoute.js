import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Caricamento...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user.isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};

export default AdminRoute; 