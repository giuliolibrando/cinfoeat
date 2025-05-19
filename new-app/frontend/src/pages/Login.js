import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import logoWhite from '../assets/logo_white.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error, isAuthenticated } = useAuth();
  const { texts } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      console.error('Errore durante il login:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }}>
        <div 
          style={{ 
            backgroundColor: '#8B0000', 
            padding: '20px', 
            display: 'flex', 
            justifyContent: 'center',
            borderTopLeftRadius: '0.375rem',
            borderTopRightRadius: '0.375rem'
          }}
        >
          <img 
            src={logoWhite} 
            alt="CinfoEat Logo" 
            height="70"
          />
        </div>
        <Card.Body>
          <div className="text-center mb-4">
            <p className="text-muted">{texts.login_intro || "Accedi con le tue credenziali istituzionali"}</p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>{texts.username}</Form.Label>
              <Form.Control
                type="text"
                placeholder={texts.enter_username || "Inserisci il tuo username istituzionale"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label>{texts.password}</Form.Label>
              <Form.Control
                type="password"
                placeholder={texts.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100"
              disabled={loading}
            >
              {loading ? (texts.logging_in || "Accesso in corso...") : texts.login}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Login; 