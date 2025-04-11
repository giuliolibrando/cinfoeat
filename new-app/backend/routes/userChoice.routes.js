const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const UserChoice = require('../models/userChoice.model');
const UserChoiceHistory = require('../models/userChoiceHistory.model');
const MenuOption = require('../models/menuOption.model');
const Config = require('../models/config.model');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// Controlla lo stato degli ordini
const checkOrderState = async () => {
  console.log('Chiamata a checkOrderState()');
  try {
    const config = await Config.findOne({ where: { function: 'order_state' } });
    console.log('Risultato della query:', config);
    return config ? config.state : false;
  } catch (error) {
    console.error('Errore in checkOrderState:', error);
    return false;
  }
};

// Ottieni lo stato degli ordini (pubblico)
router.get('/order-state', verifyToken, async (req, res) => {
  console.log('Endpoint /order-state chiamato da:', req.user.username);
  try {
    const orderState = await checkOrderState();
    console.log('orderState recuperato:', orderState);
    res.json({
      success: true,
      data: {
        state: orderState
      }
    });
  } catch (error) {
    console.error('Errore durante il recupero dello stato degli ordini:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero dello stato degli ordini.',
      error: error.message,
    });
  }
});

// Ottieni tutte le scelte dell'utente corrente
router.get('/user', verifyToken, async (req, res) => {
  try {
    const username = req.user.username;
    console.log('Recupero scelte per utente:', username);
    
    const userChoices = await UserChoice.findAll({
      where: { username },
      include: [{ model: MenuOption, as: 'menuOption' }],
    });
    console.log('Scelte utente recuperate:', userChoices);

    // Calcola il totale
    let total = 0;
    userChoices.forEach((choice) => {
      total += choice.quantity * choice.menuOption.price;
    });
    console.log('Totale calcolato:', total);

    res.json({
      success: true,
      data: {
        choices: userChoices,
        total: parseFloat(total.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Errore dettagliato nel recupero delle scelte utente:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero delle scelte dell\'utente.',
      error: error.message,
    });
  }
});

// Ottieni la cronologia degli ordini dell'utente
router.get('/user-history', verifyToken, async (req, res) => {
  try {
    const username = req.user.username;
    console.log('Recupero storico ordini per utente:', username);
    
    // Query per recuperare tutte le scelte dell'utente dalla tabella history
    const userChoices = await UserChoiceHistory.findAll({
      where: { username },
      order: [['date', 'DESC']]
    });

    console.log('Scelte utente recuperate:', userChoices.length);
    if (userChoices.length > 0) {
      console.log('Prima scelta:', userChoices[0].toJSON());
    }

    // Organizza i dati per data
    const ordersByDate = {};
    
    userChoices.forEach(choice => {
      // La data è già in formato YYYY-MM-DD, non serve convertirla
      const dateKey = choice.date;
      console.log('Elaborazione scelta per data:', dateKey);
      
      if (!ordersByDate[dateKey]) {
        ordersByDate[dateKey] = {
          date: dateKey,
          orders: [],
          total: 0
        };
      }
      
      const itemTotal = choice.price * choice.quantity;
      
      ordersByDate[dateKey].orders.push({
        id: choice.id,
        item: choice.item,
        price: choice.price,
        quantity: choice.quantity,
        total: itemTotal
      });
      
      ordersByDate[dateKey].total += itemTotal;
    });
    
    // Converti l'oggetto in array e ordina per data decrescente
    const historyArray = Object.values(ordersByDate);
    console.log('Array storico finale:', historyArray);
    
    res.json({
      success: true,
      data: {
        history: historyArray
      }
    });
  } catch (error) {
    console.error('Errore durante il recupero della cronologia ordini:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero della cronologia degli ordini.',
      error: error.message,
    });
  }
});

// Ottieni il riepilogo di tutte le scelte (solo admin)
router.get('/summary', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Ottieni tutte le scelte con il nome dell'opzione del menu
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
    
    // Calcola il totale complessivo
    const grandTotal = summaryArray.reduce((acc, user) => acc + user.total, 0);

    res.json({
      success: true,
      data: {
        users: summaryArray,
        grandTotal: parseFloat(grandTotal.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero del riepilogo delle scelte.',
      error: error.message,
    });
  }
});

// Aggiungi una nuova scelta utente
router.post('/', verifyToken, async (req, res) => {
  try {
    // Verifica se gli ordini sono aperti
    const orderState = await checkOrderState();
    if (!orderState) {
      return res.status(403).json({
        success: false,
        message: 'Gli ordini sono attualmente chiusi.',
      });
    }

    const { option_id, quantity = 1 } = req.body;
    const { username, displayName } = req.user;

    if (!option_id) {
      return res.status(400).json({
        success: false,
        message: 'ID opzione è obbligatorio.',
      });
    }

    // Verifica se l'opzione del menu esiste
    const menuOption = await MenuOption.findByPk(option_id);
    if (!menuOption) {
      return res.status(404).json({
        success: false,
        message: 'Opzione menu non trovata.',
      });
    }

    // Crea la scelta utente
    const newChoice = await UserChoice.create({
      username,
      display_name: displayName,
      option_id,
      quantity,
    });

    res.status(201).json({
      success: true,
      message: 'Scelta utente aggiunta con successo.',
      data: {
        ...newChoice.toJSON(),
        menuOption,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'aggiunta della scelta utente.',
      error: error.message,
    });
  }
});

// Aggiorna una scelta utente
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Verifica se gli ordini sono aperti
    const orderState = await checkOrderState();
    if (!orderState) {
      return res.status(403).json({
        success: false,
        message: 'Gli ordini sono attualmente chiusi.',
      });
    }

    const { id } = req.params;
    const { quantity } = req.body;
    const username = req.user.username;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La quantità deve essere un numero positivo.',
      });
    }

    // Verifica se la scelta esiste e appartiene all'utente
    const choice = await UserChoice.findOne({
      where: { id, username },
      include: [{ model: MenuOption, as: 'menuOption' }],
    });

    if (!choice) {
      return res.status(404).json({
        success: false,
        message: 'Scelta utente non trovata o non autorizzata.',
      });
    }

    // Aggiorna la quantità
    await choice.update({ quantity });

    res.json({
      success: true,
      message: 'Scelta utente aggiornata con successo.',
      data: choice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'aggiornamento della scelta utente.',
      error: error.message,
    });
  }
});

// Elimina una scelta utente
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Verifica se gli ordini sono aperti
    const orderState = await checkOrderState();
    if (!orderState) {
      return res.status(403).json({
        success: false,
        message: 'Gli ordini sono attualmente chiusi.',
      });
    }

    const { id } = req.params;
    const username = req.user.username;

    // Verifica se la scelta esiste e appartiene all'utente
    const choice = await UserChoice.findOne({
      where: { id, username },
    });

    if (!choice) {
      return res.status(404).json({
        success: false,
        message: 'Scelta utente non trovata o non autorizzata.',
      });
    }

    // Elimina la scelta
    await choice.destroy();

    res.json({
      success: true,
      message: 'Scelta utente eliminata con successo.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'eliminazione della scelta utente.',
      error: error.message,
    });
  }
});

// Elimina tutte le scelte degli utenti (solo admin)
router.delete('/all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await UserChoice.destroy({ where: {} });

    res.json({
      success: true,
      message: 'Tutte le scelte utente eliminate con successo.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'eliminazione di tutte le scelte utente.',
      error: error.message,
    });
  }
});

// Elimina una scelta utente come admin (indipendentemente dal proprietario)
router.delete('/:id/admin', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se la scelta esiste
    const choice = await UserChoice.findByPk(id);

    if (!choice) {
      return res.status(404).json({
        success: false,
        message: 'Scelta utente non trovata.',
      });
    }

    // Elimina la scelta
    await choice.destroy();

    res.json({
      success: true,
      message: 'Scelta utente eliminata con successo dall\'amministratore.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'eliminazione della scelta utente.',
      error: error.message,
    });
  }
});

// Aggiorna una scelta utente come admin (indipendentemente dal proprietario)
router.put('/:id/admin', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La quantità deve essere un numero positivo.',
      });
    }

    // Verifica se la scelta esiste
    const choice = await UserChoice.findByPk(id, {
      include: [{ model: MenuOption, as: 'menuOption' }],
    });

    if (!choice) {
      return res.status(404).json({
        success: false,
        message: 'Scelta utente non trovata.',
      });
    }

    // Aggiorna la quantità
    await choice.update({ quantity });

    res.json({
      success: true,
      message: 'Scelta utente aggiornata con successo dall\'amministratore.',
      data: choice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'aggiornamento della scelta utente.',
      error: error.message,
    });
  }
});

// Ottieni le scelte di tutti gli utenti per la data odierna
router.get('/all-choices', verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('Recupero scelte per la data:', today);
    
    // Recupera tutte le scelte per la data odierna
    const allChoices = await UserChoice.findAll({
      where: { date: today },
      include: [{ model: MenuOption, as: 'menuOption' }],
      raw: true
    });

    // Raggruppa le scelte per utente
    const choicesByUser = allChoices.reduce((acc, choice) => {
      if (!acc[choice.username]) {
        acc[choice.username] = {
          username: choice.username,
          display_name: choice.display_name,
          choices: [],
          total: 0
        };
      }
      
      acc[choice.username].choices.push({
        item: choice['menuOption.item'],
        price: choice['menuOption.price'],
        quantity: choice.quantity,
        total: parseFloat(choice['menuOption.price']) * parseInt(choice.quantity)
      });
      
      acc[choice.username].total += parseFloat(choice['menuOption.price']) * parseInt(choice.quantity);
      
      return acc;
    }, {});

    // Converti l'oggetto in array
    const formattedChoices = Object.values(choicesByUser);
    
    console.log('Scelte formattate:', formattedChoices);
    
    res.json({
      success: true,
      data: formattedChoices
    });
  } catch (error) {
    console.error('Errore durante il recupero delle scelte:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero delle scelte.',
      error: error.message
    });
  }
});

module.exports = router; 