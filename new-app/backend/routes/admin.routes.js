const express = require('express');
const router = express.Router();
const Admin = require('../models/admin.model');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');
const webpush = require('web-push');
const PushSubscription = require('../models/pushSubscription.model');
const Config = require('../models/config.model');
const ldap = require('ldapjs');

// Ottieni lo stato della configurazione
router.get('/config/:function', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { function: functionName } = req.params;
    console.log(`Richiesta GET /config/${functionName} da ${req.user.username}`);
    
    const [config, created] = await Config.findOrCreate({
      where: { function: functionName },
      defaults: {
        function: functionName,
        state: functionName === 'order_state' ? true : false,
        value: '',
      }
    });
    
    console.log(`Risultato query per ${functionName}:`, config, `Creato: ${created}`);
    
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error(`Errore durante il recupero della configurazione ${req.params.function}:`, error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero della configurazione.',
      error: error.message,
    });
  }
});

// Aggiorna lo stato della configurazione
router.put('/config/:function', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { function: functionName } = req.params;
    const { state, value } = req.body;
    
    console.log(`Richiesta PUT /config/${functionName} con state=${state} e value=${value} da ${req.user.username}`);
    
    if (state === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Lo stato della configurazione è obbligatorio.',
      });
    }
    
    const [config, created] = await Config.findOrCreate({
      where: { function: functionName },
      defaults: {
        function: functionName,
        state: functionName === 'order_state' ? true : false,
        value: '',
      }
    });
    
    await config.update({ state, value });
    
    console.log(`Configurazione ${functionName} aggiornata con successo`);
    
    // Se stiamo aggiornando lo stato degli ordini, invia notifiche
    if (functionName === 'order_state') {
      const message = state
        ? 'Gli ordini sono ora aperti!'
        : 'Gli ordini sono ora chiusi! Non è più possibile ordinare.';
      
      // Controlla se le notifiche sono abilitate
      try {
        const [notificationsConfig] = await Config.findOrCreate({
          where: { function: 'notifications_state' },
          defaults: { function: 'notifications_state', state: true },
        });
        
        if (notificationsConfig && notificationsConfig.state) {
          await sendPushNotificationToAll(
            state ? 'Ordini Aperti' : 'Ordini Chiusi',
            message
          );
        }
      } catch (notificationError) {
        console.error('Errore durante l\'invio delle notifiche:', notificationError);
      }
    }
    
    res.json({
      success: true,
      message: 'Configurazione aggiornata con successo.',
      data: config,
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento della configurazione:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'aggiornamento della configurazione.',
      error: error.message,
    });
  }
});

// Invia notifica "Pranzo arrivato"
router.post('/notify/lunch-arrived', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Controlla se le notifiche sono abilitate
    const notificationsEnabled = await Config.findOne({
      where: { function: 'notifications_state' },
    });
    
    if (!notificationsEnabled || !notificationsEnabled.state) {
      return res.status(403).json({
        success: false,
        message: 'Le notifiche sono disabilitate.',
      });
    }
    
    await sendPushNotificationToAll('Pranzo arrivato!', 'Tutti a tavola.');
    
    res.json({
      success: true,
      message: 'Notifica "Pranzo arrivato" inviata con successo.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'invio della notifica.',
      error: error.message,
    });
  }
});

// Invia notifica personalizzata
router.post('/notify/custom', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { title, body } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Titolo e corpo del messaggio sono obbligatori.',
      });
    }
    
    // Controlla se le notifiche sono abilitate
    const notificationsEnabled = await Config.findOne({
      where: { function: 'notifications_state' },
    });
    
    if (!notificationsEnabled || !notificationsEnabled.state) {
      return res.status(403).json({
        success: false,
        message: 'Le notifiche sono disabilitate.',
      });
    }
    
    await sendPushNotificationToAll(title, body);
    
    res.json({
      success: true,
      message: 'Notifica personalizzata inviata con successo.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'invio della notifica personalizzata.',
      error: error.message,
    });
  }
});

// Funzione per connettersi al server LDAP
const connectToLDAP = async () => {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: process.env.LDAP_SERVER
    });
    
    client.on('error', (err) => {
      console.error('Errore di connessione LDAP:', err);
      reject(err);
    });
    
    resolve(client);
  });
};

// Funzione per recuperare il displayName da LDAP
const getDisplayNameFromLDAP = async (username) => {
  const client = await connectToLDAP();
  
  // DN dell'utente admin per effettuare la ricerca
  const adminDN = process.env.LDAP_USER;
  const adminPassword = process.env.LDAP_PASSWORD;
  
  return new Promise((resolve, reject) => {
    // Binding iniziale con amministratore per cercare l'utente
    client.bind(adminDN, adminPassword, (bindErr) => {
      if (bindErr) {
        console.error('Errore durante il binding LDAP admin:', bindErr);
        client.destroy();
        return reject(bindErr);
      }
      
      // Cerca l'utente nel server LDAP
      const baseDN = process.env.LDAP_BASE_DN;
      const options = {
        scope: 'sub',
        filter: `(&(objectClass=user)(sAMAccountName=${username}))`,
        attributes: ['displayName', 'name', 'givenName', 'sn', 'cn']
      };
      
      client.search(baseDN, options, (searchErr, searchRes) => {
        if (searchErr) {
          console.error('Errore durante la ricerca LDAP:', searchErr);
          client.destroy();
          return reject(searchErr);
        }
        
        let displayName = username; // Default all'username
        
        searchRes.on('searchEntry', (entry) => {
          // Gestione sicura degli attributi
          const getAttributeValue = (attr) => {
            if (!attr || !attr._vals || !attr._vals[0]) return null;
            const val = attr._vals[0];
            if (val.type === 'Buffer') {
              return val.data.toString('utf8');
            }
            return val.toString();
          };
          
          const displayNameAttr = entry.attributes.find(attr => attr.type === 'displayName');
          const nameAttr = entry.attributes.find(attr => attr.type === 'name');
          const cnAttr = entry.attributes.find(attr => attr.type === 'cn');
          const givenNameAttr = entry.attributes.find(attr => attr.type === 'givenName');
          const snAttr = entry.attributes.find(attr => attr.type === 'sn');
          
          // Gerarchia di priorità per il displayName
          const displayNameValue = getAttributeValue(displayNameAttr);
          const nameValue = getAttributeValue(nameAttr);
          const cnValue = getAttributeValue(cnAttr);
          const givenNameValue = getAttributeValue(givenNameAttr);
          const snValue = getAttributeValue(snAttr);
          
          if (displayNameValue) {
            displayName = displayNameValue;
          } else if (nameValue) {
            displayName = nameValue;
          } else if (cnValue) {
            displayName = cnValue;
          } else if (givenNameValue && snValue) {
            displayName = `${givenNameValue} ${snValue}`;
          }
        });
        
        searchRes.on('error', (err) => {
          console.error('Errore durante la risposta LDAP:', err);
          client.destroy();
          reject(err);
        });
        
        searchRes.on('end', () => {
          client.destroy();
          resolve(displayName);
        });
      });
    });
  });
};

// Aggiungi un nuovo amministratore
router.post('/admins', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username è obbligatorio.',
      });
    }
    
    // Controlla se l'amministratore esiste già
    const existingAdmin = await Admin.findOne({ where: { username } });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Un amministratore con questo username esiste già.',
      });
    }

    // Recupera il displayName da LDAP
    let displayName;
    try {
      displayName = await getDisplayNameFromLDAP(username);
      console.log('DisplayName recuperato da LDAP:', displayName);
    } catch (ldapError) {
      console.error('Errore nel recupero del displayName da LDAP:', ldapError);
      displayName = username; // Fallback all'username se LDAP fallisce
    }
    
    // Crea il nuovo amministratore
    const newAdmin = await Admin.create({
      username,
      display_name: displayName,
      isActive: true
    });
    
    return res.status(201).json({
      success: true,
      message: 'Amministratore aggiunto con successo.',
      data: newAdmin
    });
  } catch (error) {
    console.error('Errore durante l\'aggiunta dell\'amministratore:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante l\'aggiunta dell\'amministratore.',
      error: error.message
    });
  }
});

// Ottieni tutti gli amministratori
router.get('/admins', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const admins = await Admin.findAll();
    
    res.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero degli amministratori.',
      error: error.message,
    });
  }
});

// Rimuovi un amministratore
router.delete('/admins/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Amministratore non trovato.',
      });
    }
    
    await admin.destroy();
    
    res.json({
      success: true,
      message: 'Amministratore rimosso con successo.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante la rimozione dell\'amministratore.',
      error: error.message,
    });
  }
});

// Funzione helper per inviare notifiche push a tutti gli utenti
const sendPushNotificationToAll = async (title, body) => {
  try {
    console.log('Inizio invio notifiche push...');
    const subscriptions = await PushSubscription.findAll();
    console.log(`Trovate ${subscriptions.length} sottoscrizioni push`);
    
    if (subscriptions.length === 0) {
      console.log('Nessuna sottoscrizione push trovata, non è possibile inviare notifiche');
      return true;
    }
    
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: '/favicon.ico', // Uso un'icona che esiste
    });
    
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        console.log(`Invio notifica a: ${subscription.username}, endpoint: ${subscription.endpoint.substring(0, 30)}...`);
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          notificationPayload
        );
        console.log(`Notifica inviata con successo a: ${subscription.username}`);
      } catch (error) {
        console.error(`Errore durante l'invio della notifica push a ${subscription.username}:`, error);
        // Se la sottoscrizione non è più valida, eliminala dal database
        if (error.statusCode === 410) {
          console.log(`Eliminazione sottoscrizione non valida per: ${subscription.username}`);
          await subscription.destroy();
        }
      }
    });
    
    await Promise.all(sendPromises);
    console.log('Tutte le notifiche sono state inviate con successo');
    return true;
  } catch (error) {
    console.error('Errore durante l\'invio delle notifiche push:', error);
    throw error;
  }
};

// Route per ottenere tutte le configurazioni
router.get('/configs', verifyToken, async (req, res) => {
  try {
    const configs = await Config.findAll();
    const configMap = {};
    configs.forEach(config => {
      configMap[config.function] = {
        state: config.state,
        value: config.value
      };
    });
    res.json({ data: configMap });
  } catch (error) {
    console.error('Errore nel recupero delle configurazioni:', error);
    res.status(500).json({ error: 'Errore nel recupero delle configurazioni' });
  }
});

// Route per aggiornare una configurazione
router.put('/configs/:function', verifyToken, async (req, res) => {
  try {
    const { function: functionName } = req.params;
    const { state, value } = req.body;

    const [config, created] = await Config.findOrCreate({
      where: { function: functionName },
      defaults: { state: false, value: '' }
    });

    await config.update({ state, value });
    res.json({ data: config });
  } catch (error) {
    console.error('Errore nell\'aggiornamento della configurazione:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento della configurazione' });
  }
});

module.exports = router; 