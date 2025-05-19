const express = require('express');
const router = express.Router();
const MenuOption = require('../models/menuOption.model');
const MenuHistory = require('../models/menuHistory.model');
const UserChoice = require('../models/userChoice.model');
const UserChoiceHistory = require('../models/userChoiceHistory.model');
const Payment = require('../models/payment.model');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');
const { sequelize } = require('../config/database');
const Config = require('../models/config.model');

console.log('Menu routes caricate');

// Log delle route registrate
router.stack.forEach(function(r){
    if (r.route && r.route.path){
        console.log('Route registrata:', r.route.stack[0].method.toUpperCase(), r.route.path);
    }
});

// GET /menu - Ottieni tutte le opzioni del menu
router.get(['/', ''], verifyToken, async (req, res) => {
  try {
    console.log('Recupero tutte le opzioni del menu...');
    const menuOptions = await MenuOption.findAll({
      order: [['created_at', 'DESC']],
      raw: true
    });
    console.log('Opzioni del menu recuperate:', menuOptions.length);
    res.json({
      success: true,
      data: {
        options: menuOptions
      }
    });
  } catch (error) {
    console.error('Errore nel recupero del menu:', error);
    res.status(500).json({ 
      success: false,
      message: 'Errore nel recupero del menu' 
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

    // 4. Aggiorna la data dei piatti default invece di eliminarli
    const defaultItems = await MenuOption.findAll({
      where: { flag_isdefault: true }
    });
    
    for (const item of defaultItems) {
      await item.update({
        date: new Date().toISOString().split('T')[0]
      });
    }
    console.log('Data aggiornata per i piatti default');

    // 5. Elimina solo i piatti non default
    await MenuOption.destroy({ 
      where: {
        flag_isdefault: false
      }
    });
    console.log('Menu eliminato (elementi Default preservati)');

    // 6. Elimina TUTTI i pagamenti
    await Payment.destroy({ where: {} });
    console.log('Pagamenti eliminati');

    // 7. Recupera il menu aggiornato
    const updatedMenu = await MenuOption.findAll({
      order: [['created_at', 'DESC']],
      raw: true
    });

    res.json({
      success: true,
      message: 'Menu azzerato con successo.',
      data: {
        options: updatedMenu
      }
    });
  } catch (error) {
    console.error('Errore durante l\'azzeramento del menu:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'azzeramento del menu.',
      error: error.message
    });
  }
});

// POST /menu - Aggiungi una nuova opzione al menu
router.post(['/', ''], verifyToken, async (req, res) => {
  try {
    console.log('Richiesta POST /menu ricevuta:', req.body);
    const { item, price, flag_isdefault } = req.body;

    // Validazione input
    if (!item || !price) {
      return res.status(400).json({
        success: false,
        message: 'Nome e prezzo sono obbligatori'
      });
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Il prezzo deve essere un numero positivo'
      });
    }

    // Creazione nuovo piatto
    const newDish = await MenuOption.create({
      item,
      price: priceNum,
      flag_isdefault: flag_isdefault || false,
      date: new Date().toISOString().split('T')[0]
    });

    console.log('Nuovo piatto creato:', newDish.toJSON());

    // Recupera tutte le opzioni del menu aggiornate
    const menuOptions = await MenuOption.findAll({
      order: [['created_at', 'DESC']],
      raw: true
    });

    console.log('Menu aggiornato recuperato:', menuOptions.length, 'opzioni');

    // Invia la risposta con il formato corretto
    res.json({
      success: true,
      data: {
        options: menuOptions
      }
    });
  } catch (error) {
    console.error('Errore durante l\'aggiunta del piatto:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'aggiunta del piatto',
      error: error.message
    });
  }
});

// PUT /menu/:id - Aggiorna un'opzione del menu
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { item, price, flag_isdefault } = req.body;

    const dish = await MenuOption.findByPk(id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Piatto non trovato'
      });
    }

    await dish.update({
      item: item || dish.item,
      price: price || dish.price,
      flag_isdefault: flag_isdefault !== undefined ? flag_isdefault : dish.flag_isdefault
    });

    const updatedMenu = await MenuOption.findAll({
      order: [['createdAt', 'DESC']],
      raw: true
    });

    res.json({
      success: true,
      data: updatedMenu
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento del piatto:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento del piatto'
    });
  }
});

// DELETE /menu/:id - Elimina un'opzione del menu
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const dish = await MenuOption.findByPk(id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Piatto non trovato'
      });
    }

    await dish.destroy();

    // Recupera il menu aggiornato usando il nome corretto della colonna
    const updatedMenu = await MenuOption.findAll({
      order: [['created_at', 'DESC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        options: updatedMenu
      }
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione del piatto:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione del piatto',
      error: error.message
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
