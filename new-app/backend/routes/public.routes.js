const express = require('express');
const router = express.Router();
const Configuration = require('../models/configuration.model');
const Config = require('../models/config.model');

// Ottieni la configurazione del menu esterno
router.get('/external-menu-config', async (req, res) => {
  try {
    console.log('Richiesta configurazione menu esterno ricevuta');
    
    const config = await Configuration.findOne({
      where: { function: 'external_menu_link' }
    });
    
    console.log('Configurazione menu esterno trovata:', config);
    
    // Se non troviamo la configurazione, restituiamo un oggetto con state false e value vuoto
    const response = config || {
      function: 'external_menu_link',
      state: false,
      value: '',
      updated_at: new Date()
    };
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Errore nel recupero della configurazione del menu esterno:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero della configurazione.',
      error: error.message
    });
  }
});

// Ottieni le note della home
router.get('/home-notes', async (req, res) => {
  try {
    console.log('Richiesta note home ricevuta');
    
    const config = await Configuration.findOne({
      where: { function: 'home_notes' }
    });
    
    console.log('Note home trovate:', config);
    
    // Se non troviamo la configurazione, restituiamo un oggetto con state false e value vuoto
    const response = config || {
      function: 'home_notes',
      state: false,
      value: '',
      updated_at: new Date()
    };
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Errore nel recupero delle note della home:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero delle note.',
      error: error.message
    });
  }
});

// Ottieni l'email PayPal
router.get('/paypal-email', async (req, res) => {
  try {
    console.log('Richiesta email PayPal ricevuta');
    
    const config = await Configuration.findOne({
      where: { function: 'paypal_email' }
    });
    
    console.log('Email PayPal trovata:', config);
    
    // Se non troviamo la configurazione, restituiamo un oggetto con state false e value vuoto
    const response = config || {
      function: 'paypal_email',
      state: false,
      value: '',
      updated_at: new Date()
    };
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Errore nel recupero dell\'email PayPal:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero dell\'email PayPal.',
      error: error.message
    });
  }
});

// Ottieni lo stato degli ordini
router.get('/order-state', async (req, res) => {
  try {
    console.log('Richiesta stato ordini ricevuta');
    
    const config = await Config.findOne({
      where: { function: 'order_state' }
    });
    
    console.log('Stato ordini trovato:', config);
    
    // Se non troviamo la configurazione, restituiamo un oggetto con state true
    const response = config || {
      function: 'order_state',
      state: true,
      value: ''
    };
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Errore nel recupero dello stato degli ordini:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante il recupero dello stato degli ordini.',
      error: error.message
    });
  }
});

module.exports = router; 