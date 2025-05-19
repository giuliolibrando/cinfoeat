const express = require('express');
const router = express.Router();
const db = require('../models');
const webpush = require('web-push');

// Configura le chiavi VAPID - queste sono chiavi generate appositamente
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BGYhXeiZv0wApRGwgWVHoWH3oXPLtOwLDKy-vrrVODsxRWrWgC3oq3Zq26ltVnt4z48y1n8iCEQJl_LG08npulQ';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'rpQHTVWdNvuGrHYaWxZNlHfQgsAGvGqrHU7vHI5Y25I';

// Configura webpush con un email di contatto valido
webpush.setVapidDetails(
  'mailto:support@cinfoeat.com',  // Cambia con un email valido
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Ottieni la chiave pubblica VAPID
router.get('/vapid-public-key', (req, res) => {
  res.status(200).json({ publicKey: VAPID_PUBLIC_KEY });
});

// Sottoscrivi un utente alle notifiche
router.post('/subscribe', async (req, res) => {
  try {
    const { username, endpoint, p256dh, auth } = req.body;
    
    if (!username || !endpoint || !p256dh || !auth) {
      return res.status(400).json({ message: 'Dati di sottoscrizione mancanti' });
    }
    
    // Controlla se esiste già una sottoscrizione per questo endpoint
    const existingSubscription = await db.PushSubscription.findOne({
      where: { endpoint: endpoint }
    });
    
    if (existingSubscription) {
      // Aggiorna la sottoscrizione esistente
      await existingSubscription.update({
        username,
        p256dh,
        auth
      });
      
      return res.status(200).json({ message: 'Sottoscrizione aggiornata con successo' });
    }
    
    // Crea una nuova sottoscrizione
    await db.PushSubscription.create({
      username,
      endpoint,
      p256dh,
      auth
    });
    
    res.status(201).json({ message: 'Sottoscrizione creata con successo' });
  } catch (error) {
    console.error('Errore durante la sottoscrizione:', error);
    res.status(500).json({ message: 'Errore durante la sottoscrizione', error: error.message });
  }
});

// Cancella una sottoscrizione
router.post('/unsubscribe', async (req, res) => {
  try {
    const { username, endpoint } = req.body;
    
    if (!username || !endpoint) {
      return res.status(400).json({ message: 'Username o endpoint mancante' });
    }
    
    // Trova e cancella la sottoscrizione
    const deleted = await db.PushSubscription.destroy({
      where: {
        username,
        endpoint
      }
    });
    
    if (deleted > 0) {
      return res.status(200).json({ message: 'Sottoscrizione cancellata con successo' });
    }
    
    res.status(404).json({ message: 'Sottoscrizione non trovata' });
  } catch (error) {
    console.error('Errore durante la cancellazione della sottoscrizione:', error);
    res.status(500).json({ message: 'Errore durante la cancellazione', error: error.message });
  }
});

// Invia una notifica a un utente specifico
router.post('/send-to-user', async (req, res) => {
  try {
    const { username, title, body, icon, tag, data } = req.body;
    
    if (!username || !title || !body) {
      return res.status(400).json({ message: 'Parametri mancanti' });
    }
    
    // Trova tutte le sottoscrizioni dell'utente
    const subscriptions = await db.PushSubscription.findAll({
      where: { username }
    });
    
    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'Nessuna sottoscrizione trovata per questo utente' });
    }
    
    // Crea il payload della notifica
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/favicon.ico',
      tag: tag || 'cinfoeat-notification',
      data: data || {}
    });
    
    // Invia la notifica a tutte le sottoscrizioni dell'utente
    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          }, payload);
          
          return { success: true, endpoint: subscription.endpoint };
        } catch (error) {
          console.error('Errore nell\'invio della notifica:', error);
          
          // Se la sottoscrizione non è più valida, eliminala
          if (error.statusCode === 404 || error.statusCode === 410) {
            await db.PushSubscription.destroy({
              where: { endpoint: subscription.endpoint }
            });
          }
          
          return { success: false, endpoint: subscription.endpoint, error: error.message };
        }
      })
    );
    
    // Verifica se almeno una notifica è stata inviata con successo
    const successCount = results.filter(r => r.success).length;
    
    if (successCount > 0) {
      return res.status(200).json({
        message: `Notifica inviata con successo a ${successCount}/${subscriptions.length} dispositivi`,
        results
      });
    }
    
    res.status(500).json({
      message: 'Impossibile inviare notifiche a nessun dispositivo',
      results
    });
  } catch (error) {
    console.error('Errore durante l\'invio della notifica:', error);
    res.status(500).json({ message: 'Errore durante l\'invio della notifica', error: error.message });
  }
});

// Invia una notifica a tutti gli utenti (solo per admin)
router.post('/send-to-all', async (req, res) => {
  try {
    const { title, body, icon, tag, data } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ message: 'Parametri mancanti' });
    }
    
    // Verifica che l'utente sia admin (implementa questa logica)
    const isAdmin = true; // Sostituisci con la verifica reale
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Solo gli amministratori possono inviare notifiche a tutti' });
    }
    
    // Trova tutte le sottoscrizioni
    const subscriptions = await db.PushSubscription.findAll();
    
    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'Nessuna sottoscrizione trovata' });
    }
    
    console.log(`Invio notifica a ${subscriptions.length} sottoscrizioni`);
    
    // Crea il payload della notifica
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/favicon.ico',
      tag: tag || 'cinfoeat-notification',
      data: data || {}
    });
    
    // Invia la notifica a tutte le sottoscrizioni
    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          }, payload);
          
          return { success: true, endpoint: subscription.endpoint };
        } catch (error) {
          console.error('Errore nell\'invio della notifica:', error);
          
          // Se la sottoscrizione non è più valida, eliminala
          if (error.statusCode === 404 || error.statusCode === 410) {
            await db.PushSubscription.destroy({
              where: { endpoint: subscription.endpoint }
            });
          }
          
          return { success: false, endpoint: subscription.endpoint, error: error.message };
        }
      })
    );
    
    // Verifica se almeno una notifica è stata inviata con successo
    const successCount = results.filter(r => r.success).length;
    
    if (successCount > 0) {
      return res.status(200).json({
        message: `Notifica inviata con successo a ${successCount}/${subscriptions.length} dispositivi`,
        results
      });
    }
    
    res.status(500).json({
      message: 'Impossibile inviare notifiche a nessun dispositivo',
      results
    });
  } catch (error) {
    console.error('Errore durante l\'invio della notifica:', error);
    res.status(500).json({ message: 'Errore durante l\'invio della notifica', error: error.message });
  }
});

// Gestione delle sottoscrizioni di mock per ambiente di sviluppo locale
router.post('/mock-endpoint/:username', (req, res) => {
  console.log(`Ricevuta notifica per mock endpoint dell'utente: ${req.params.username}`);
  console.log('Body della notifica:', req.body);
  
  // Rispondi con successo per simulare una corretta ricezione
  res.status(201).send();
});

module.exports = router; 