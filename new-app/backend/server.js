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

// Importa l'istanza di Sequelize dal file di configurazione
const sequelize = require('./config/database');

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


app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/choices', userChoiceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/public', publicRoutes);

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
    // Verifica la connessione al database
    await sequelize.authenticate();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
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
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Si è verificato un errore interno al server',
  });
});

// Avvio del server
const PORT = process.env.PORT || 3001;

// Funzione per avviare il server HTTP
const startHttpServer = async () => {
  const httpServer = http.createServer(app);
  await new Promise((resolve) => {
    httpServer.listen(PORT, async () => {
      try {
        await sequelize.authenticate();
        console.log('Connessione al database stabilita con successo.');
        // Sincronizza i modelli con il database
        await sequelize.sync({ alter: true });
        console.log('Modelli sincronizzati con successo.');
        console.log(`Server HTTP in esecuzione sulla porta ${PORT}`);
        resolve();
      } catch (error) {
        console.error('Impossibile connettersi al database:', error);
        process.exit(1);
      }
    });
  });
  return httpServer;
};

// Avvia il server HTTP
const server = startHttpServer();

// Gestione del segnale SIGTERM
process.on('SIGTERM', () => {
  console.log('Ricevuto segnale SIGTERM, chiusura in corso...');
  server.close(() => {
    console.log('Server HTTP chiuso.');
    process.exit(0);
  });
});

module.exports = app; 