const express = require('express');
const router = express.Router();
const MenuOption = require('../models/menuOption.model');
const MenuHistory = require('../models/menuHistory.model');
const UserChoice = require('../models/userChoice.model');
const UserChoiceHistory = require('../models/userChoiceHistory.model');
const Payment = require('../models/payment.model');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Config = require('../models/config.model');

console.log('Menu routes caricate');

// Log delle route registrate
router.stack.forEach(function(r){
    if (r.route && r.route.path){
        console.log('Route registrata:', r.route.stack[0].method.toUpperCase(), r.route.path);
    }
});

// Ottieni tutte le opzioni del menu del giorno corrente
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('Tentativo di recupero delle opzioni del menu');
    const menuOptions = await MenuOption.findAll();
    console.log('Opzioni del menu recuperate:', menuOptions);
    
    // Ottieni la data corrente
    const today = new Date();
    const formattedDate = today.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    res.json({
      success: true,
      data: {
        options: menuOptions,
        date: formattedDate
      },
    });
  } catch (error) {
    console.error('Errore durante il recupero delle opzioni del menu:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero delle opzioni del menu.',
      error: error.message,
    });
  }
});

// Ottieni le opzioni predefinite del giorno corrente
router.get('/default', verifyToken, async (req, res) => {
  try {
    console.log('Tentativo di recupero delle opzioni predefinite del giorno corrente');
    const defaultOptions = await MenuOption.findAll({
      where: { 
        flag_isdefault: true
      },
    });
    console.log('Opzioni predefinite recuperate:', defaultOptions);
    res.json({
      success: true,
      data: defaultOptions,
    });
  } catch (error) {
    console.error('Errore durante il recupero delle opzioni predefinite:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero delle opzioni predefinite.',
      error: error.message,
    });
  }
});

// Ottieni lo storico del menu per una data specifica (solo admin)
router.get('/history/:date', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { date } = req.params;
    const history = await MenuHistory.findAll({
      where: { date }
    });
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Errore durante il recupero dello storico del menu:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero dello storico del menu.',
      error: error.message,
    });
  }
});

// Crea un nuovo menu per il giorno corrente (solo admin)
router.post('/new-day', verifyToken, verifyAdmin, async (req, res) => {
  console.log('Route /new-day chiamata');
  
  try {
    // 1. Controlla se gli ordini sono chiusi
    const [orderState, created] = await Config.findOrCreate({
      where: { function: 'order_state' },
      defaults: {
        function: 'order_state',
        state: true,
        value: ''
      }
    });
    
    console.log('Stato ordini:', orderState.state);
    
    // 2. Salva lo storico degli ordini attivi
    const activeOrders = await UserChoice.findAll({
      include: [{
        model: MenuOption,
        as: 'menuOption'
      }]
    });

    if (activeOrders.length > 0) {
      // Salva gli ordini nello storico
      await UserChoiceHistory.bulkCreate(
        activeOrders.map(order => ({
          date: new Date().toISOString().split('T')[0],
          username: order.username,
          display_name: order.display_name,
          item: order.menuOption.item,
          price: order.menuOption.price,
          quantity: order.quantity
        }))
      );
      console.log('Ordini salvati nello storico');

      // Salva il menu nello storico
      const menuItems = await MenuOption.findAll();
      await MenuHistory.bulkCreate(
        menuItems.map(item => ({
          date: new Date().toISOString().split('T')[0],
          item: item.item,
          price: item.price,
          flag_isdefault: item.flag_isdefault
        }))
      );
      console.log('Menu salvato nello storico');
    }

    // 3. Elimina TUTTE le scelte degli utenti
    await UserChoice.destroy({ where: {} });
    console.log('Scelte utenti eliminate');

    // 4. Elimina il menu preservando gli elementi Default
    await MenuOption.destroy({ 
      where: {
        flag_isdefault: false
      }
    });
    console.log('Menu eliminato (elementi Default preservati)');

    // 5. Elimina TUTTI i pagamenti
    await Payment.destroy({ where: {} });
    console.log('Pagamenti eliminati');

    res.json({
      success: true,
      message: 'Menu azzerato con successo.',
    });
  } catch (error) {
    console.error('Errore durante l\'azzeramento del menu:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'azzeramento del menu.',
      error: error.message,
    });
  }
});

// Aggiungi una nuova opzione al menu
router.post('/', verifyToken, async (req, res) => {
  try {
    // Controlla se gli ordini sono aperti
    const orderState = await Config.findOne({
      where: { function: 'order_state' }
    });

    if (!orderState || !orderState.state) {
      return res.status(403).json({
        success: false,
        message: 'Non è possibile aggiungere piatti quando gli ordini sono chiusi.',
      });
    }

    const { item, price, flag_isdefault } = req.body;
    const today = new Date().toISOString().split('T')[0];

    if (!item || !price) {
      return res.status(400).json({
        success: false,
        message: 'Nome e prezzo sono campi obbligatori.',
      });
    }

    const newOption = await MenuOption.create({
      item,
      price,
      flag_isdefault: flag_isdefault || false,
      date: today
    });

    res.status(201).json({
      success: true,
      message: 'Opzione menu creata con successo.',
      data: newOption,
    });
  } catch (error) {
    console.error('Errore durante la creazione dell\'opzione menu:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante la creazione dell\'opzione menu.',
      error: error.message,
    });
  }
});

// Aggiorna un'opzione del menu (solo admin)
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { item, price, flag_isdefault } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const option = await MenuOption.findByPk(id);
    if (!option) {
      return res.status(404).json({
        success: false,
        message: 'Opzione menu non trovata.',
      });
    }

    await option.update({
      item: item || option.item,
      price: price || option.price,
      flag_isdefault: flag_isdefault !== undefined ? flag_isdefault : option.flag_isdefault,
      date: today
    });

    res.json({
      success: true,
      message: 'Opzione menu aggiornata con successo.',
      data: option,
    });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dell\'opzione menu:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'aggiornamento dell\'opzione menu.',
      error: error.message,
    });
  }
});

// Elimina un'opzione del menu (solo admin)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const option = await MenuOption.findByPk(id);
    if (!option) {
      return res.status(404).json({
        success: false,
        message: 'Opzione menu non trovata.',
      });
    }

    await option.destroy();

    res.json({
      success: true,
      message: 'Opzione menu eliminata con successo.',
    });
  } catch (error) {
    console.error('Errore durante l\'eliminazione dell\'opzione menu:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'eliminazione dell\'opzione menu.',
      error: error.message,
    });
  }
});

// Ottieni lo storico completo degli ordini (solo admin)
router.get('/history-orders', verifyToken, verifyAdmin, async (req, res) => {
  try {
    console.log('Recupero storico ordini...');
    
    // Recupera lo storico degli ordini ordinato per data decrescente
    const history = await UserChoiceHistory.findAll({
      order: [['date', 'DESC']],
      raw: true
    });
    
    console.log('Storico ordini recuperato:', history.length, 'record');

    // Raggruppa gli ordini per data
    const groupedHistory = history.reduce((acc, order) => {
      const date = order.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          orders: [],
          numUsers: 0,
          numOrders: 0,
          totalAmount: 0
        };
      }
      
      acc[date].orders.push(order);
      acc[date].numOrders++;
      acc[date].totalAmount += parseFloat(order.price) * parseInt(order.quantity);
      
      // Conta utenti unici per data
      const uniqueUsers = new Set(acc[date].orders.map(o => o.username));
      acc[date].numUsers = uniqueUsers.size;
      
      return acc;
    }, {});

    // Converti l'oggetto in array e ordina per data decrescente
    const formattedHistory = Object.values(groupedHistory).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    console.log('Storico formattato:', formattedHistory.length, 'giorni');

    res.json({
      success: true,
      data: formattedHistory
    });
  } catch (error) {
    console.error('Errore durante il recupero dello storico degli ordini:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero dello storico degli ordini.',
      error: error.message
    });
  }
});

module.exports = router; 