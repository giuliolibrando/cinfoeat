const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/user.model');

/**
 * Middleware di autenticazione per verificare il token JWT
 */
const verifyToken = (req, res, next) => {
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  
  // Controlla se esiste un token
  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'Token di autenticazione non fornito'
    });
  }

  // Rimuovi Bearer se presente
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  try {
    // Verifica il token
    const decoded = jwt.verify(token, config.secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Errore nella verifica del token:', error);
    return res.status(401).json({
      success: false,
      message: 'Token non valido o scaduto'
    });
  }
};

/**
 * Middleware per verificare se l'utente è un amministratore
 */
const isAdmin = async (req, res, next) => {
  try {
    // Verifica se l'utente esiste prima di continuare
    if (!req.user || !req.user.username) {
      return res.status(403).json({
        success: false,
        message: 'Utente non autorizzato'
      });
    }

    const user = await User.findOne({
      where: { username: req.user.username }
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Richiesto ruolo di amministratore'
      });
    }

    next();
  } catch (error) {
    console.error('Errore nella verifica del ruolo admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante la verifica dei permessi'
    });
  }
};

/**
 * Middleware facoltativo che verifica il token se presente
 * ma non blocca la richiesta se il token è assente
 */
const optionalAuth = (req, res, next) => {
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  
  if (!token) {
    // Continua senza utente autenticato
    next();
    return;
  }

  // Rimuovi Bearer se presente
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = jwt.verify(token, config.secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    // Continua senza utente autenticato in caso di token non valido
    console.error('Token opzionale non valido:', error);
    next();
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  optionalAuth
}; 