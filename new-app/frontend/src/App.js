import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import './App.css';

function AppContent() {
  const [loading, setLoading] = useState(true);
  const { texts } = useLanguage();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    // Simulazione di caricamento iniziale
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{texts.loading}</p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <ConfigProvider>
        <div className="app">
          {/* Mostra la navbar solo se non è la pagina di login */}
          {!isLoginPage && <Navbar />}
          <Container className={isLoginPage ? "p-0" : "mt-4"}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Container>
          <Toaster position="top-right" />
        </div>
      </ConfigProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App; 