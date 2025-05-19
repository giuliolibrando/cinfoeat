import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService, handleAuthError } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.me();
        
        if (response.data.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // Token non valido, rimuovi dal localStorage
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Errore durante la verifica del token:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      console.log('Tentativo di login con:', { username });
      
      const response = await authService.login({ username, password });
      console.log('Risposta dal server:', response.data);
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Salva il token nel localStorage
        localStorage.setItem('token', token);
        
        setUser(user);
        setIsAuthenticated(true);
        return true;
      } else {
        setError(response.data.message);
        return false;
      }
    } catch (err) {
      console.error('Errore dettagliato durante il login:', err);
      setError(handleAuthError(err));
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Errore durante il logout:', err);
    } finally {
      // Rimuovi il token dal localStorage
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 