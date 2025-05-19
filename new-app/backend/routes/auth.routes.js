const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model');
const User = require('../models/user.model');
const dotenv = require('dotenv');
const ldap = require('ldapjs');
const { verifyToken } = require('../middleware/auth');
const Config = require('../models/config.model');

dotenv.config();

// Imposto la modalità development solo se NODE_ENV è effettivamente 'development'
const isDevelopment = process.env.NODE_ENV === 'development';
console.log('Modalità di sviluppo:', isDevelopment);

// Funzione per connettersi al server LDAP
const connectToLDAP = async () => {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: process.env.LDAP_SERVER,
      tlsOptions: {
        rejectUnauthorized: false
      }
    });
    
    client.on('error', (err) => {
      console.error('Errore di connessione LDAP:', err);
      reject(err);
    });
    
    resolve(client);
  });
};

// Funzione per autenticare l'utente con LDAP
const authenticateWithLDAP = async (username, password) => {
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
        attributes: ['displayName', 'name', 'givenName', 'sn', 'mail', 'cn', 'sAMAccountName']
      };
      
      console.log('Query LDAP:', {
        baseDN,
        filter: options.filter,
        attributes: options.attributes
      });
      
      client.search(baseDN, options, (searchErr, searchRes) => {
        if (searchErr) {
          console.error('Errore durante la ricerca LDAP:', searchErr);
          client.destroy();
          return reject(searchErr);
        }
        
        let userDN = null;
        let displayName = username; // Default all'username
        let mail = '';
        
        searchRes.on('searchEntry', (entry) => {
          userDN = entry.objectName;
          console.log('Entry LDAP trovata:', JSON.stringify(entry, null, 2));
          
          // Log dettagliato di tutti gli attributi
          console.log('=== DETTAGLI ATTRIBUTI LDAP ===');
          entry.attributes.forEach(attr => {
            const values = attr._vals.map(v => {
              if (v.type === 'Buffer') {
                return v.data.toString('utf8');
              }
              return v.toString();
            });
            console.log(`Attributo ${attr.type}:`, values);
          });
          console.log('==============================');
          
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
          const givenNameAttr = entry.attributes.find(attr => attr.type === 'givenName');
          const snAttr = entry.attributes.find(attr => attr.type === 'sn');
          const cnAttr = entry.attributes.find(attr => attr.type === 'cn');
          const mailAttr = entry.attributes.find(attr => attr.type === 'mail');
          const samAccountNameAttr = entry.attributes.find(attr => attr.type === 'sAMAccountName');
          
          // Log degli attributi trovati
          console.log('=== ATTRIBUTI TROVATI ===');
          console.log('displayName:', getAttributeValue(displayNameAttr));
          console.log('name:', getAttributeValue(nameAttr));
          console.log('givenName:', getAttributeValue(givenNameAttr));
          console.log('sn:', getAttributeValue(snAttr));
          console.log('cn:', getAttributeValue(cnAttr));
          console.log('mail:', getAttributeValue(mailAttr));
          console.log('sAMAccountName:', getAttributeValue(samAccountNameAttr));
          console.log('========================');
          
          // Gerarchia di priorità per il displayName
          const displayNameValue = getAttributeValue(displayNameAttr);
          const nameValue = getAttributeValue(nameAttr);
          const cnValue = getAttributeValue(cnAttr);
          const givenNameValue = getAttributeValue(givenNameAttr);
          const snValue = getAttributeValue(snAttr);
          
          if (displayNameValue) {
            displayName = displayNameValue;
            console.log('Usando displayName da LDAP:', displayName);
          } else if (nameValue) {
            displayName = nameValue;
            console.log('Usando name da LDAP:', displayName);
          } else if (cnValue) {
            displayName = cnValue;
            console.log('Usando cn da LDAP:', displayName);
          } else if (givenNameValue && snValue) {
            displayName = `${givenNameValue} ${snValue}`;
            console.log('Costruito nome da givenName e sn:', displayName);
          } else {
            console.log('Nessun attributo per il nome trovato, uso username:', username);
          }
          
          const mailValue = getAttributeValue(mailAttr);
          if (mailValue) {
            mail = mailValue;
          }
        });
        
        searchRes.on('error', (err) => {
          console.error('Errore durante la risposta LDAP:', err);
          client.destroy();
          reject(err);
        });
        
        searchRes.on('end', () => {
          if (!userDN) {
            client.destroy();
            return reject(new Error('Utente non trovato'));
          }
          
          // Binding con l'utente trovato per verificare la password
          client.bind(userDN, password, (userBindErr) => {
            if (userBindErr) {
              console.error('Errore durante il binding LDAP utente:', userBindErr);
              client.destroy();
              return reject(userBindErr);
            }
            
            client.destroy();
            resolve({ displayName, mail });
          });
        });
      });
    });
  });
};

// Login route con supporto LDAP
router.post('/login', async (req, res) => {
  console.log('Richiesta di login ricevuta:', req.body);
  
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('Username o password mancanti');
      return res.status(400).json({ success: false, message: 'Username e password sono obbligatori.' });
    }

    console.log(`Tentativo di login per l'utente: ${username}`);
    
    // Verifica se l'utente è un amministratore nel database
    const admin = await Admin.findOne({ where: { username } });
    const isAdmin = !!admin || username.toLowerCase().includes('admin');
    
    // Ottieni displayName dal database se presente per gli admin
    const adminDisplayName = admin ? admin.display_name : null;
    
    console.log(`L'utente ${username} è admin: ${isAdmin}, displayName nel DB: ${adminDisplayName}`);
    
    // Se è in modalità di sviluppo, bypassiamo l'autenticazione LDAP
    if (isDevelopment) {
      console.log('Modalità di sviluppo attiva - Autenticazione LDAP bypassata');
      
      // Usa displayName dal database se disponibile
      let displayName = adminDisplayName;
      
      // Se non c'è un displayName nel database
      if (!displayName) {
        // Se l'utente contiene "admin", formatta come "Admin Nome"
        if (username.toLowerCase().includes('admin')) {
          const parts = username.split('admin');
          displayName = `Admin ${parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : username}`;
        } else {
          displayName = username.charAt(0).toUpperCase() + username.slice(1);
        }
      }
      

      
      // Crea il token JWT
      const token = jwt.sign(
        { username, displayName, isAdmin },
        process.env.JWT_SECRET || 'cinfoeat_jwt_secret_key',
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      );
      
      console.log(`Token di fallback generato per l'utente ${username} in ambiente di sviluppo con displayName: ${displayName}`);
      
      return res.json({
        success: true,
        message: 'Login effettuato con successo (modalità sviluppo).',
        token,
        user: {
          username,
          displayName,
          isAdmin,
        },
      });
    } else {
      // Modalità produzione - Usa LDAP
      try {
        // Autenticazione LDAP
        const ldapUser = await authenticateWithLDAP(username, password);
        console.log(`Autenticazione LDAP riuscita per l'utente ${username}`);
        
        // Usa una gerarchia di priorità per il displayName:
        // 1. displayName dal database degli admin se esiste
        // 2. displayName da LDAP se disponibile
        // 3. Fallback all'username con prima lettera maiuscola
        let displayName = adminDisplayName;
        
        if (!displayName && ldapUser.displayName) {
          displayName = ldapUser.displayName;
        }
        
        if (!displayName) {
          // Se l'utente contiene "admin", formatta come "Admin Nome"
          if (username.toLowerCase().includes('admin')) {
            const parts = username.split('admin');
            displayName = `Admin ${parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : username}`;
          } else {
            displayName = username.charAt(0).toUpperCase() + username.slice(1);
          }
        }
        
        // Per gli admin noti, imposta nomi specifici
        if (username === '312518admin') {
          displayName = 'Admin 312518';
          console.log('Nome specifico impostato per admin 312518');
        }
        
        // Crea il token JWT
        const token = jwt.sign(
          { username, displayName, isAdmin, email: ldapUser.mail },
          process.env.JWT_SECRET || 'cinfoeat_jwt_secret_key',
          { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );
        
        console.log(`Token generato per l'utente ${username} con displayName: ${displayName}`);
        
        return res.json({
          success: true,
          message: 'Login effettuato con successo.',
          token,
          user: {
            username,
            displayName,
            isAdmin,
            email: ldapUser.mail
          },
        });
      } catch (ldapError) {
        console.error('Errore durante l\'autenticazione LDAP:', ldapError);
        
        return res.status(401).json({ 
          success: false, 
          message: 'Credenziali non valide',
          error: ldapError.message 
        });
      }
    }
  } catch (error) {
    console.error('Errore durante il login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore interno del server durante l\'autenticazione.',
      error: error.message 
    });
  }
});

// Route per ottenere i dati dell'utente corrente
router.get('/me', verifyToken, async (req, res) => {
  console.log('Richiesta di verifica token ricevuta');
  
  // Ottieni il token dall'header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Token non fornito o formato non valido');
    return res.status(401).json({ success: false, message: 'Token non fornito.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cinfoeat_jwt_secret_key');
    console.log('Token decodificato:', decoded);
    
    // Verifica se l'utente è un amministratore nel database (doppio controllo)
    const username = decoded.username;
    const admin = await Admin.findOne({ where: { username } });
    // Considera admin anche gli utenti con "admin" nel nome
    const isAdmin = !!admin || username.toLowerCase().includes('admin');
    
    // Per gli admin noti, imposta nomi specifici
    let displayName = decoded.displayName;
    if (username === '312518admin' && (!displayName || displayName === '312518admin')) {
      displayName = 'Admin 312518';
      console.log('Nome specifico impostato per admin 312518 in /me');
    }
    
    // Invia la risposta con i dati dell'utente
    return res.json({
      success: true,
      user: {
        username,
        displayName,
        isAdmin,
        email: decoded.email
      }
    });
  } catch (error) {
    console.error('Errore durante la verifica del token:', error);
    return res.status(401).json({ success: false, message: 'Token non valido o scaduto.' });
  }
});

// Route per il logout
router.post('/logout', verifyToken, async (req, res) => {
  // Implementa la logica di logout
  res.json({ success: true, message: 'Logout effettuato con successo.' });
});

// Update user language preference
router.post('/language', verifyToken, async (req, res) => {
  try {
    const { language } = req.body;
    
    if (!language) {
      return res.status(400).json({
        success: false,
        message: 'Language parameter is required.'
      });
    }
    
    // Update the global system language configuration
    const [config, created] = await Config.findOrCreate({
      where: { function: 'default_language' },
      defaults: {
        function: 'default_language',
        state: true,
        value: language
      }
    });
    
    if (!created) {
      config.value = language;
      await config.save();
    }
    
    res.json({
      success: true,
      message: 'Language preference updated successfully.',
      data: { language }
    });
  } catch (error) {
    console.error('Error updating language preference:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating language preference.',
      error: error.message
    });
  }
});

// Get user language preference
router.get('/language', verifyToken, async (req, res) => {
  try {
    // Get the global system language configuration
    const config = await Config.findOne({
      where: { function: 'default_language' }
    });
    
    // Default to English if config not found
    const language = config && config.value ? config.value : 'en';
    
    res.json({
      success: true,
      data: { language }
    });
  } catch (error) {
    console.error('Error retrieving language preference:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving language preference.',
      error: error.message
    });
  }
});

module.exports = router; 