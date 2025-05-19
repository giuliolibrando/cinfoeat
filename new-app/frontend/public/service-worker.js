// Nome e versione della cache
const CACHE_NAME = 'cinfoeat-cache-v1';

// Definisci lo scope corretto
self.scope = '/';

// Aggiungi qui le risorse da pre-caricare
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico'
];

// Evento di installazione - Pre-carica le risorse
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Evento di attivazione - Pulisce le vecchie cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Gestione delle richieste con strategia "Cache First"
self.addEventListener('fetch', event => {
  // Ignora le richieste non HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se la risorsa è nella cache, restituiscila
        if (response) {
          return response;
        }
        
        // Altrimenti, fai una richiesta di rete
        return fetch(event.request)
          .then(response => {
            // Se la risposta non è valida, restituiscila com'è
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona la risposta perché è un flusso che può essere letto una sola volta
            const responseToCache = response.clone();
            
            // Apri la cache e aggiungi la risposta
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
  );
});

// Gestione delle notifiche push
self.addEventListener('push', event => {
  console.log('Push ricevuto:', event);
  
  let notification = {};
  
  try {
    notification = event.data.json();
  } catch (e) {
    notification = {
      title: 'CinfoEat Notifica',
      body: event.data ? event.data.text() : 'Nuova notifica da CinfoEat',
      icon: '/favicon.ico'
    };
  }
  
  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/favicon.ico',
      badge: '/favicon.ico',
      data: notification.data || {},
      // Altre opzioni
      vibrate: [100, 50, 100],
      requireInteraction: notification.requireInteraction || false,
      tag: notification.tag || 'cinfoeat-notification'
    })
  );
});

// Gestione del click sulle notifiche
self.addEventListener('notificationclick', event => {
  console.log('Notifica cliccata:', event);
  
  event.notification.close();
  
  // Comportamento quando l'utente clicca sulla notifica
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Se c'è già una finestra aperta, la attiva
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Altrimenti, apre una nuova finestra
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
}); 