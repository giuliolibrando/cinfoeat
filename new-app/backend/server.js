const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const webpush = require('web-push');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');

// Carica le variabili d'ambiente
dotenv.config();

// Inizializza l'app Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Configurazione Web Push
if (process.env.PUBLIC_VAPID_KEY && process.env.PRIVATE_VAPID_KEY) {
  webpush.setVapidDetails(
    process.env.WEB_PUSH_CONTACT,
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
  );
}

// Importa la configurazione del database
const { sequelize, testConnection } = require('./config/database');

// Importa i modelli
const models = require('./models');
const Admin = require('./models/admin.model');
const MenuOption = require('./models/menuOption.model');
const UserChoice = require('./models/userChoice.model');
const Payment = require('./models/payment.model');
const Configuration = require('./models/configuration.model');
const MenuHistory = require('./models/menuHistory.model');
const UserChoiceHistory = require('./models/userChoiceHistory.model');

// Importa le route
const authRoutes = require('./routes/auth.routes');
const menuRoutes = require('./routes/menu.routes');
const userChoiceRoutes = require('./routes/userChoice.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');
const publicRoutes = require('./routes/public.routes');

// Definisci le route
app.use('/auth', authRoutes);
app.use('/menu', menuRoutes);
app.use('/choices', userChoiceRoutes);
app.use('/notifications', notificationRoutes);
app.use('/admin', adminRoutes);
app.use('/payments', paymentRoutes);
app.use('/public', publicRoutes);

// Log delle route registrate
console.log('Route registrate:');
const listEndpoints = require('express-list-endpoints');
console.log(listEndpoints(app));

// Route principale
app.get('/', (req, res) => {
  res.json({ message: 'Benvenuto all\'API di CinfoEat!' });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('[Health Check] Database connection failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Endpoint pubblico per ottenere tutte le scelte degli utenti (con /api)
app.get('/public/all-user-choices', async (req, res) => {
  try {
    console.log('Richiesta pubblica di tutte le scelte degli utenti (con /api)');
    
    // Ottieni tutte le scelte con le relative opzioni menu
    const allChoices = await UserChoice.findAll({
      include: [{ model: MenuOption, as: 'menuOption' }],
    });
    
    // Raggruppa per utente
    const userSummary = {};
    allChoices.forEach((choice) => {
      if (!userSummary[choice.username]) {
        userSummary[choice.username] = {
          username: choice.username,
          display_name: choice.display_name,
          choices: [],
          total: 0,
        };
      }
      
      userSummary[choice.username].choices.push({
        id: choice.id,
        item: choice.menuOption.item,
        price: choice.menuOption.price,
        quantity: choice.quantity,
        total: choice.quantity * choice.menuOption.price,
      });
      
      userSummary[choice.username].total += choice.quantity * choice.menuOption.price;
    });
    
    // Converti l'oggetto in array
    const summaryArray = Object.values(userSummary);
    
    res.json({
      success: true,
      data: summaryArray
    });
  } catch (error) {
    console.error('Errore durante il recupero delle scelte degli utenti:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero delle scelte degli utenti',
      error: error.message
    });
  }
});

// Gestione degli errori
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(500).json({
    success: false,
    message: 'Si è verificato un errore interno al server',
    error: err.message
  });
});

// Avvio del server
const PORT = process.env.PORT || 3001;

// Funzione per avviare il server HTTP
const startHttpServer = async () => {
  try {
    // Test della connessione al database e sincronizzazione dei modelli
    console.log('[Server] Testing database connection...');
    await testConnection();
    
    // Crea il server HTTP
    const httpServer = http.createServer(app);
    
    // Avvia il server
    await new Promise((resolve) => {
      httpServer.listen(PORT, () => {
        console.log(`[Server] HTTP server running on port ${PORT}`);
        resolve();
      });
    });
    
    return httpServer;
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

// Avvia il server HTTP
let server;
(async () => {
  try {
    server = await startHttpServer();
    console.log('[Server] Successfully started');
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
})();

// Gestione del segnale SIGTERM
process.on('SIGTERM', () => {
  console.log('[Server] Received SIGTERM signal, shutting down...');
  if (server) {
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      sequelize.close().then(() => {
        console.log('[Database] Connection closed.');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
});

module.exports = app; 
