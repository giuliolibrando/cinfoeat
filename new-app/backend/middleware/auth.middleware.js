const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Middleware per verificare il token JWT
const verifyToken = (req, res, next) => {
  // Ottieni il token dall'header Authorization
  const authHeader = req.headers.authorization;
  console.log('Auth header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Token non fornito o formato non valido');
    return res.status(401).json({
      success: false,
      message: 'Accesso negato. Token non fornito o formato non valido.',
    });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token estratto:', token.substring(0, 20) + '...');

  try {
    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificato:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Errore nella verifica del token:', error);
    res.status(401).json({
      success: false,
      message: 'Token non valido o scaduto.',
    });
  }
};

// Middleware per verificare se l'utente è un amministratore
const verifyAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Accesso negato. Richiesti privilegi di amministratore.',
    });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
}; 