import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import NotificationSubscriber from '../components/NotificationSubscriber';
import api from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [userStats, setUserStats] = useState(null);
  
  // Log per debug
  useEffect(() => {
    if (user) {
      console.log('Informazioni utente:', user);
    }
  }, [user]);

  // Carica lo storico degli ordini dell'ultimo mese
  useEffect(() => {
    const fetchOrderHistory = async () => {
      setLoadingHistory(true);
      setError(null);
      
      try {
        console.log('Inizio recupero storico ordini');
        const response = await api.userChoice.getUserHistory();
        console.log('Risposta API storico completa:', response);
        console.log('Risposta API storico data:', response.data);
        console.log('Risposta API storico success:', response.data.success);
        console.log('Risposta API storico history:', response.data.data.history);
        
        if (response.data.success) {
          setOrderHistory(response.data.data.history);
          console.log('Storico ordini impostato nello stato:', response.data.data.history);
        } else {
          console.error('Risposta API non di successo:', response.data);
          setError('Errore nel recupero dei dati');
        }
      } catch (err) {
        console.error('Errore durante il recupero della cronologia ordini:', err);
        console.error('Dettagli errore:', err.response?.data || err.message);
        setError('Non è stato possibile caricare la cronologia degli ordini.');
      } finally {
        setLoadingHistory(false);
      }
    };
    
    if (user) {
      console.log('Utente autenticato, avvio recupero storico');
      fetchOrderHistory();
    } else {
      console.log('Nessun utente autenticato');
    }
  }, [user]);

  // Genera statistiche utente basate sulla cronologia degli ordini
  useEffect(() => {
    console.log('useEffect per statistiche - orderHistory:', orderHistory);
    console.log('useEffect per statistiche - orderHistory.length:', orderHistory.length);
    
    if (orderHistory.length > 0) {
      console.log('Calcolo statistiche per storico:', orderHistory);
      // Calcola le statistiche
      const stats = calculateUserStats(orderHistory);
      console.log('Statistiche calcolate:', stats);
      setUserStats(stats);
    } else {
      console.log('Nessun dato storico disponibile per le statistiche');
    }
  }, [orderHistory]);

  // Calcola le statistiche dell'utente
  const calculateUserStats = (history) => {
    // Inizializza contatori e accumulatori
    let totalSpent = 0;
    let daysWithOrders = 0;
    let totalItems = 0;
    const dishCounts = {};
    
    // Analizza ogni giorno di ordini
    history.forEach(dayOrder => {
      if (dayOrder.orders && dayOrder.orders.length > 0) {
        daysWithOrders++;
        
        // Analizza gli ordini del giorno
        dayOrder.orders.forEach(order => {
          totalSpent += parseFloat(order.total);
          totalItems += order.quantity;
          
          // Conta le occorrenze di ciascun piatto
          const dishName = order.item;
          if (dishCounts[dishName]) {
            dishCounts[dishName] += order.quantity;
          } else {
            dishCounts[dishName] = order.quantity;
          }
        });
      }
    });
    
    // Trova il piatto più ordinato
    let mostOrderedDish = { name: 'Nessuno', count: 0 };
    for (const [dish, count] of Object.entries(dishCounts)) {
      if (count > mostOrderedDish.count) {
        mostOrderedDish = { name: dish, count };
      }
    }
    
    // Calcola la media giornaliera
    const averageDailySpent = daysWithOrders > 0 ? totalSpent / daysWithOrders : 0;
    
    return {
      totalSpent,
      averageDailySpent,
      daysWithOrders,
      totalItems,
      mostOrderedDish
    };
  };

  // Formatta la data in formato italiano
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('it-IT', options);
  };

  return (
    <Container>
      <h1 className="mb-4">Profilo Utente</h1>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header as="h5">Informazioni Personali</Card.Header>
            <Card.Body>
              <p><strong>Nome:</strong> {user?.displayName}</p>
              <p><strong>Ruolo:</strong> {user?.isAdmin ? 'Amministratore' : 'Utente'}</p>
              <p className="text-muted">La password è gestita tramite Active Directory (LDAP)</p>
            </Card.Body>
          </Card>
          
          <NotificationSubscriber />
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header as="h5">Sessione</Card.Header>
            <Card.Body>
              <Button variant="danger" onClick={logout}>
                Logout
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Statistiche Mensili */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header as="h5">Statistiche Mensili</Card.Header>
            <Card.Body>
              {loadingHistory ? (
                <div className="text-center my-3">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Caricamento...</span>
                  </Spinner>
                </div>
              ) : userStats ? (
                <Row>
                  <Col md={6} lg={3} className="mb-3">
                    <Card className="h-100 text-center">
                      <Card.Body>
                        <i className="bi bi-currency-euro fs-2 text-primary mb-2"></i>
                        <h5>Spesa Totale</h5>
                        <h3 className="text-primary">€{userStats.totalSpent.toFixed(2)}</h3>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3} className="mb-3">
                    <Card className="h-100 text-center">
                      <Card.Body>
                        <i className="bi bi-calendar-check fs-2 text-success mb-2"></i>
                        <h5>Media Giornaliera</h5>
                        <h3 className="text-success">€{userStats.averageDailySpent.toFixed(2)}</h3>
                        <p className="text-muted">Su {userStats.daysWithOrders} giorni</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3} className="mb-3">
                    <Card className="h-100 text-center">
                      <Card.Body>
                        <i className="bi bi-star-fill fs-2 text-warning mb-2"></i>
                        <h5>Piatto Preferito</h5>
                        <h3 className="text-warning">{userStats.mostOrderedDish.name}</h3>
                        <Badge bg="warning" className="text-dark">
                          {userStats.mostOrderedDish.count} volte
                        </Badge>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3} className="mb-3">
                    <Card className="h-100 text-center">
                      <Card.Body>
                        <i className="bi bi-box fs-2 text-info mb-2"></i>
                        <h5>Totale Items</h5>
                        <h3 className="text-info">{userStats.totalItems}</h3>
                        <p className="text-muted">Ordinati nel mese</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              ) : (
                <Alert variant="info">
                  Non ci sono dati sufficienti per generare statistiche.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header as="h5">Storico Ordini (Ultimo Mese)</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              {loadingHistory ? (
                <div className="text-center my-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Caricamento...</span>
                  </Spinner>
                </div>
              ) : orderHistory.length > 0 ? (
                <>
                  {orderHistory.map((dayOrder) => (
                    <div key={dayOrder.date} className="mb-4">
                      <h5>{formatDate(dayOrder.date)}</h5>
                      <Table responsive striped hover>
                        <thead>
                          <tr>
                            <th>Prodotto</th>
                            <th>Prezzo</th>
                            <th>Quantità</th>
                            <th>Totale</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayOrder.orders.map((order) => (
                            <tr key={order.id}>
                              <td>{order.item}</td>
                              <td>€{(typeof order.price === 'number' ? order.price : parseFloat(order.price)).toFixed(2)}</td>
                              <td>{order.quantity}</td>
                              <td>€{(typeof order.total === 'number' ? order.total : parseFloat(order.total)).toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr className="table-info">
                            <td colSpan={3} className="text-end fw-bold">Totale giornaliero:</td>
                            <td className="fw-bold">€{(typeof dayOrder.total === 'number' ? dayOrder.total : parseFloat(dayOrder.total)).toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </div>
                  ))}
                </>
              ) : (
                <Alert variant="info">
                  Non ci sono ordini nell'ultimo mese.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile; 