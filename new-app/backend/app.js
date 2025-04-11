const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const adminRoutes = require('./routes/admin.routes');
const menuRoutes = require('./routes/menu.routes');
const userChoiceRoutes = require('./routes/userChoice.routes');
const paymentRoutes = require('./routes/payment.routes');
const authRoutes = require('./routes/auth.routes');
const pushSubscriptionRoutes = require('./routes/pushSubscription.routes');

// Importa i modelli
const Config = require('./models/config.model');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/choices', userChoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/push-subscriptions', pushSubscriptionRoutes);

// Sincronizza i modelli con il database
sequelize.sync({ alter: true }).then(() => {
  console.log('Database sincronizzato');
  
  // Inizializza le configurazioni di default se non esistono
  const defaultConfigs = [
    { function: 'paypal_enabled', state: false, value: '' },
    { function: 'home_notes_enabled', state: false, value: '' },
    { function: 'external_menu_enabled', state: false, value: '' },
    { function: 'notifications_enabled', state: false, value: '' },
    { function: 'order_state', state: true, value: '' }
  ];

  defaultConfigs.forEach(async (config) => {
    try {
      await Config.findOrCreate({
        where: { function: config.function },
        defaults: config
      });
    } catch (error) {
      console.error(`Errore nell'inizializzazione della configurazione ${config.function}:`, error);
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
}); 