import React, { useState, useEffect } from 'react';
import { Button, Card, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';

const NotificationSubscriber = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('initializing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Verifica se le notifiche push sono supportate
        if (!notificationService.isPushSupported()) {
          setStatus('not-supported');
          return;
        }

        // Registra il service worker
        await notificationService.registerServiceWorker();
        
        // Verifica se l'utente è già iscritto
        const isSubscribed = await notificationService.checkSubscription();
        setStatus(isSubscribed ? 'subscribed' : 'not-subscribed');
      } catch (err) {
        console.error('Errore nell\'inizializzazione delle notifiche:', err);
        setError(err.message);
        setStatus('error');
      }
    };

    initializeComponent();
  }, []);

  const handleSubscribe = async () => {
    try {
      setStatus('subscribing');
      setError(null);
      
      // Richiedi il permesso e sottoscrivi l'utente
      await notificationService.subscribeToPushNotifications(user.displayName);
      
      setStatus('subscribed');
    } catch (err) {
      console.error('Errore durante la sottoscrizione:', err);
      
      // Verifica se l'errore è relativo ai permessi
      if (Notification.permission === 'denied') {
        setError('Le notifiche sono state bloccate. Per favore, abilita le notifiche nelle impostazioni del browser.');
      } else {
        setError(`Errore durante la sottoscrizione: ${err.message}`);
      }
      
      setStatus('error');
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setStatus('unsubscribing');
      setError(null);
      
      // Cancella la sottoscrizione
      await notificationService.unsubscribeFromPushNotifications(user.displayName);
      
      setStatus('not-subscribed');
    } catch (err) {
      console.error('Errore durante la cancellazione della sottoscrizione:', err);
      setError(`Errore durante la cancellazione: ${err.message}`);
      setStatus('error');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'initializing':
        return <Alert variant="info">Inizializzazione delle notifiche...</Alert>;
        
      case 'not-supported':
        return (
          <Alert variant="warning">
            Il tuo browser non supporta le notifiche push. Prova ad utilizzare Chrome, Firefox, Edge o Safari.
          </Alert>
        );
        
      case 'subscribing':
        return <Alert variant="info">Attivazione delle notifiche in corso...</Alert>;
        
      case 'unsubscribing':
        return <Alert variant="info">Disattivazione delle notifiche in corso...</Alert>;
        
      case 'subscribed':
        return (
          <>
            <Alert variant="success">
              Hai attivato le notifiche! Riceverai aggiornamenti sugli ordini e altre informazioni importanti.
            </Alert>
            <Button variant="outline-danger" onClick={handleUnsubscribe}>
              Disattiva notifiche
            </Button>
          </>
        );
        
      case 'not-subscribed':
        return (
          <>
            <Alert variant="info">
              Attiva le notifiche per ricevere aggiornamenti sugli ordini e altre informazioni importanti.
            </Alert>
            <Button variant="primary" onClick={handleSubscribe}>
              Attiva notifiche
            </Button>
          </>
        );
        
      case 'error':
        return (
          <>
            <Alert variant="danger">
              {error || 'Si è verificato un errore. Riprova più tardi.'}
            </Alert>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Riprova
            </Button>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header as="h5">Notifiche Push</Card.Header>
      <Card.Body>
        <Card.Text>
          Ricevi notifiche quando i tuoi ordini cambiano stato o quando ci sono importanti aggiornamenti.
        </Card.Text>
        {renderContent()}
      </Card.Body>
    </Card>
  );
};

export default NotificationSubscriber; 