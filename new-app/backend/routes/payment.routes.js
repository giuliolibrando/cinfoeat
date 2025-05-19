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
    const { username, display_name, amount_paid, total_amount, is_completed, partial_change_given } = req.body;
    console.log('Richiesta di creazione pagamento:', { username, display_name, amount_paid, total_amount, is_completed, partial_change_given });

    // Controlla se esiste già un pagamento per questo utente
    const existingPayment = await Payment.findOne({ where: { username } });
    
    if (existingPayment) {
      console.log('Pagamento esistente trovato, aggiornamento:', existingPayment.id);
      
      // Aggiorna il pagamento esistente
      await existingPayment.update({
        amount_paid,
        total_amount,
        change_amount: Math.max(0, amount_paid - total_amount),
        partial_change_given: partial_change_given || 0,
        is_completed: is_completed || false,
        payment_status: is_completed ? 'completed' : 'pending',
        payment_date: new Date()
      });
      
      console.log('Pagamento aggiornato:', existingPayment);
      return res.status(200).json({
        success: true,
        message: 'Pagamento aggiornato con successo',
        data: existingPayment
      });
    }

    // Crea un nuovo pagamento
    const payment = await Payment.create({
      username,
      display_name,
      amount_paid,
      total_amount,
      change_amount: Math.max(0, amount_paid - total_amount),
      partial_change_given: partial_change_given || 0,
      is_completed: is_completed || false,
      payment_status: is_completed ? 'completed' : 'pending',
      payment_date: new Date()
    });

    console.log('Nuovo pagamento creato:', payment);
    res.status(201).json({
      success: true,
      message: 'Pagamento creato con successo',
      data: payment
    });
  } catch (error) {
    console.error('Errore durante la creazione del pagamento:', error);
    res.status(500).json({ 
      success: false,
      error: 'Errore durante la creazione del pagamento',
      message: error.message
    });
  }
});

// Aggiorna lo stato di un pagamento
router.put('/:username', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const { amount_paid, total_amount, is_completed, partial_change_given } = req.body;
    
    console.log('Richiesta di aggiornamento pagamento:', { 
      username, 
      amount_paid, 
      total_amount, 
      is_completed, 
      partial_change_given 
    });

    const payment = await Payment.findOne({ where: { username } });

    if (!payment) {
      console.log('Pagamento non trovato, creazione nuovo pagamento');
      // Se il pagamento non esiste, crealo
      const newPayment = await Payment.create({
        username,
        display_name: req.body.display_name || username,
        amount_paid: amount_paid || 0,
        total_amount: total_amount || 0,
        change_amount: Math.max(0, (amount_paid || 0) - (total_amount || 0)),
        partial_change_given: partial_change_given || 0,
        is_completed: is_completed || false,
        payment_status: is_completed ? 'completed' : 'pending',
        payment_date: new Date()
      });
      
      console.log('Nuovo pagamento creato:', newPayment);
      return res.status(201).json({
        success: true,
        message: 'Nuovo pagamento creato con successo.',
        data: newPayment
      });
    }

    console.log('Aggiornamento pagamento esistente:', payment.id);
    // Aggiorna solo i campi forniti
    const updateData = {
      payment_date: new Date()
    };
    
    if (amount_paid !== undefined) updateData.amount_paid = amount_paid;
    if (total_amount !== undefined) updateData.total_amount = total_amount;
    if (is_completed !== undefined) updateData.is_completed = is_completed;
    if (partial_change_given !== undefined) updateData.partial_change_given = partial_change_given;
    
    // Calcola il resto solo se abbiamo sia l'importo pagato che il totale
    if (amount_paid !== undefined && total_amount !== undefined) {
      updateData.change_amount = Math.max(0, amount_paid - total_amount);
    } else if (amount_paid !== undefined) {
      updateData.change_amount = Math.max(0, amount_paid - payment.total_amount);
    }
    
    // Imposta lo stato del pagamento
    if (is_completed !== undefined) {
      updateData.payment_status = is_completed ? 'completed' : 'pending';
    }

    await payment.update(updateData);
    console.log('Pagamento aggiornato:', payment);

    res.json({
      success: true,
      message: 'Stato del pagamento aggiornato con successo.',
      data: payment
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento dello stato del pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'aggiornamento dello stato del pagamento.',
      error: error.message
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
      data: {
        amount_paid: payment.amount_paid,
        total_amount: payment.total_amount,
        change_amount: payment.change_amount,
        partial_change_given: payment.partial_change_given,
        is_completed: payment.is_completed
      }
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