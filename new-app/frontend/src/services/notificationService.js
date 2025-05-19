import api from './api';

// Verifica se le notifiche push sono supportate
const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Registra il service worker
const registerServiceWorker = async () => {
  if (!isPushSupported()) {
    throw new Error('Push notifications non sono supportate da questo browser');
  }
  
  try {
    // Registrazione con scope esplicito
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });
    console.log('Service Worker registrato con successo:', registration);
    return registration;
  } catch (error) {
    console.error('Errore durante la registrazione del Service Worker:', error);
    throw error;
  }
};

// Richiede le chiavi pubbliche VAPID dal server
const getVapidPublicKey = async () => {
  try {
    const response = await api.notification.getVapidPublicKey();
    return response.data.publicKey;
  } catch (error) {
    console.error('Errore nel recupero della chiave VAPID pubblica:', error);
    throw error;
  }
};

// Converte una stringa base64 in un array di byte
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Sottoscrivi l'utente alle notifiche push
const subscribeToPushNotifications = async (displayName) => {
  try {
    // Registra service worker se non già fatto
    const registration = await navigator.serviceWorker.ready;
    
    // Ottieni la sottoscrizione esistente, se presente
    let subscription = await registration.pushManager.getSubscription();
    
    // Se l'utente è già iscritto, ritorna la sottoscrizione esistente
    if (subscription) {
      console.log('Utente già iscritto, restituzione sottoscrizione esistente:', subscription);
      return subscription;
    }
    
    try {
      // Ottieni la chiave pubblica VAPID dal server
      const vapidPublicKey = await getVapidPublicKey();
      console.log('Chiave VAPID pubblica ottenuta:', vapidPublicKey);
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      // Crea una nuova sottoscrizione
      console.log('Tentativo di creare una nuova sottoscrizione...');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      console.log('Sottoscrizione creata con successo:', subscription);
      
      // Invia la sottoscrizione al server
      await saveSubscription(subscription, displayName);
      
      return subscription;
    } catch (pushError) {
      console.error('Errore durante la creazione della sottoscrizione:', pushError);
      
      // Verifica se siamo in ambiente di sviluppo locale
      const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDevelopment) {
        console.warn('Ambiente di sviluppo locale rilevato. Utilizzo di una sottoscrizione mock per test.');
        
        // Simula una sottoscrizione in ambiente di sviluppo locale
        const mockSubscription = {
          endpoint: `/notifications/mock-endpoint/${displayName}`,
          toJSON: () => ({
            endpoint: `/notifications/mock-endpoint/${displayName}`,
            keys: {
              p256dh: 'mock-p256dh-key-for-development',
              auth: 'mock-auth-key-for-development'
            }
          })
        };
        
        try {
          // Salva comunque la mock subscription per il test in locale
          console.log('Salvataggio mock subscription:', mockSubscription);
          await saveSubscription(mockSubscription, displayName);
          return mockSubscription;
        } catch (mockError) {
          console.error('Errore anche durante il salvataggio della mock subscription:', mockError);
          throw mockError;
        }
      }
      
      throw pushError;
    }
  } catch (error) {
    console.error('Errore durante la sottoscrizione alle notifiche push:', error);
    throw error;
  }
};

// Salva la sottoscrizione nel database
const saveSubscription = async (subscription, displayName) => {
  try {
    const subscriptionObject = subscription.toJSON();
    console.log('Salvataggio sottoscrizione nel server:', subscriptionObject);
    
    await api.post('/notifications/subscribe', {
      username: displayName,
      endpoint: subscriptionObject.endpoint,
      p256dh: subscriptionObject.keys.p256dh,
      auth: subscriptionObject.keys.auth
    });
    
    console.log('Sottoscrizione salvata nel server con successo');
    return true;
  } catch (error) {
    console.error('Errore durante il salvataggio della sottoscrizione:', error);
    throw error;
  }
};

// Cancella la sottoscrizione
const unsubscribeFromPushNotifications = async (displayName) => {
  try {
    // Ottieni la sottoscrizione corrente
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('Nessuna sottoscrizione attiva trovata');
      return false; // Già non iscritto
    }
    
    console.log('Annullamento sottoscrizione:', subscription);
    
    // Cancella la sottoscrizione nel browser
    const unsubscribed = await subscription.unsubscribe();
    
    if (unsubscribed) {
      console.log('Sottoscrizione annullata con successo nel browser');
      
      // Notifica il server di rimuovere la sottoscrizione
      try {
        await api.post('/notifications/unsubscribe', { 
          username: displayName,
          endpoint: subscription.endpoint 
        });
        console.log('Sottoscrizione rimossa dal server');
      } catch (serverError) {
        console.error('Errore nella rimozione della sottoscrizione dal server:', serverError);
      }
    }
    
    return unsubscribed;
  } catch (error) {
    console.error('Errore durante l\'annullamento dell\'iscrizione:', error);
    throw error;
  }
};

// Verifica se l'utente è già iscritto
const checkSubscription = async () => {
  if (!isPushSupported()) {
    console.log('Push notifications non supportate da questo browser');
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    console.log('Verifica sottoscrizione, risultato:', !!subscription);
    return !!subscription;
  } catch (error) {
    console.error('Errore durante la verifica dello stato di iscrizione:', error);
    return false;
  }
};

const notificationService = {
  isPushSupported,
  registerServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  checkSubscription
};

export default notificationService; 