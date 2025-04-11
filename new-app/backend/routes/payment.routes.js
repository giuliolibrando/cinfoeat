const express = require('express');
const router = express.Router();
const Payment = require('../models/payment.model');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');
const UserChoice = require('../models/userChoice.model');
const MenuOption = require('../models/menuOption.model');

// Ottieni tutti i pagamenti (solo admin)
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      order: [['payment_date', 'DESC']],
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('Errore nel recupero dei pagamenti:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero dei pagamenti.',
      error: error.message,
    });
  }
});

// Aggiungi un nuovo pagamento
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { username, display_name, amount_paid, total_amount, is_completed } = req.body;
    console.log('Richiesta di creazione pagamento:', { username, display_name, amount_paid, total_amount, is_completed });

    // Crea il pagamento
    const payment = await Payment.create({
      username,
      display_name,
      amount_paid,
      total_amount,
      change_amount: amount_paid - total_amount,
      partial_change_given: 0,
      is_completed: is_completed || false,
      payment_status: is_completed ? 'completed' : 'pending',
      payment_date: new Date()
    });

    console.log('Pagamento creato:', payment);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Errore durante la creazione del pagamento:', error);
    res.status(500).json({ error: 'Errore durante la creazione del pagamento' });
  }
});

// Aggiorna lo stato di un pagamento
router.put('/:username', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const { is_completed, partial_change_given } = req.body;

    const payment = await Payment.findOne({ where: { username } });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento non trovato.',
      });
    }

    await payment.update({ 
      is_completed: is_completed !== undefined ? is_completed : payment.is_completed,
      partial_change_given: partial_change_given !== undefined ? partial_change_given : payment.partial_change_given,
      payment_date: new Date(),
    });

    res.json({
      success: true,
      message: 'Stato del pagamento aggiornato con successo.',
      data: payment,
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento dello stato del pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'aggiornamento dello stato del pagamento.',
      error: error.message,
    });
  }
});

// Elimina un pagamento
router.delete('/:username', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { username } = req.params;

    const payment = await Payment.findOne({ where: { username } });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento non trovato.',
      });
    }

    await payment.destroy();

    res.json({
      success: true,
      message: 'Pagamento eliminato con successo.',
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione del pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'eliminazione del pagamento.',
      error: error.message,
    });
  }
});

// Ottieni il pagamento dell'utente corrente
router.get('/user', verifyToken, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      where: { username: req.user.username }
    });

    if (!payment) {
      return res.json({
        success: true,
        data: {
          amount_paid: 0,
          total_amount: 0,
          change_amount: 0,
          partial_change_given: 0,
          is_completed: false
        }
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Errore nel recupero del pagamento utente:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero del pagamento.',
      error: error.message
    });
  }
});

// Segnala un pagamento come effettuato
router.post('/mark-as-paid', verifyToken, async (req, res) => {
  try {
    console.log('\n=== NUOVA RICHIESTA MARK-AS-PAID ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('User:', req.user);
    
    const { username, displayName } = req.user;
    console.log('Utente:', { username, displayName });
    
    // Ottieni il totale dell'ordine dell'utente
    const userChoices = await UserChoice.findAll({
      where: { username },
      include: [{
        model: MenuOption,
        as: 'menuOption',
        attributes: ['price']
      }]
    });
    console.log('Scelte utente:', JSON.stringify(userChoices, null, 2));

    if (!userChoices || userChoices.length === 0) {
      console.log('Nessuna scelta trovata per l\'utente');
      return res.status(400).json({
        success: false,
        message: 'Non hai ancora effettuato nessuna scelta nel menu'
      });
    }

    const totalAmount = userChoices.reduce((total, choice) => {
      return total + (choice.menuOption.price * choice.quantity);
    }, 0);
    console.log('Totale ordine:', totalAmount);
    
    // Crea un nuovo pagamento
    const payment = await Payment.create({
      username,
      display_name: displayName,
      amount_paid: totalAmount,
      total_amount: totalAmount,
      change_amount: 0,
      partial_change_given: 0,
      is_completed: true,
      payment_status: 'pending_confirmation',
      payment_date: new Date()
    });
    
    console.log('Nuovo pagamento creato:', JSON.stringify(payment, null, 2));

    console.log('=== RISPOSTA MARK-AS-PAID ===');
    res.json({
      success: true,
      message: 'Pagamento segnalato come effettuato, in attesa di conferma',
      data: payment
    });
  } catch (error) {
    console.error('\n=== ERRORE MARK-AS-PAID ===');
    console.error('Stack:', error.stack);
    console.error('Message:', error.message);
    console.error('=====================\n');
    
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante la segnalazione del pagamento',
      error: error.message
    });
  }
});

module.exports = router; 