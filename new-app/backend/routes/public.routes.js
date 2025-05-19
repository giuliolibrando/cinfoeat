const express = require('express');
const router = express.Router();
const Configuration = require('../models/configuration.model');
const Config = require('../models/config.model');

// Ottieni la configurazione del menu esterno
router.get('/external-menu-config', async (req, res) => {
  try {
    console.log('Richiesta configurazione menu esterno ricevuta');
    
    // Prima verifichiamo se la funzionalità Menu Esterno è abilitata a livello di sistema
    const enabledConfig = await Configuration.findOne({
      where: { function: 'external_menu_enabled' }
    });
    
    // Se external_menu_enabled è false, restituiamo immediatamente state=false indipendentemente dall'altra config
    if (!enabledConfig || !enabledConfig.state) {
      return res.json({
        success: true,
        data: {
          function: 'external_menu_link',
          state: false,
          value: '',
          updated_at: new Date()
        }
      });
    }
    
    // Se invece external_menu_enabled è true, procediamo normalmente con la config del link
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
    
    // Prima verifichiamo se la funzionalità Note Home è abilitata a livello di sistema
    const enabledConfig = await Configuration.findOne({
      where: { function: 'home_notes_enabled' }
    });
    
    // Se home_notes_enabled è false, restituiamo immediatamente state=false indipendentemente dall'altra config
    if (!enabledConfig || !enabledConfig.state) {
      return res.json({
        success: true,
        data: {
          function: 'home_notes',
          state: false,
          value: '',
          updated_at: new Date()
        }
      });
    }
    
    // Se invece home_notes_enabled è true, procediamo normalmente con la config delle note
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
    
    // Prima verifichiamo se la funzionalità PayPal è abilitata a livello di sistema
    const enabledConfig = await Configuration.findOne({
      where: { function: 'paypal_enabled' }
    });
    
    // Se paypal_enabled è false, restituiamo immediatamente state=false indipendentemente dall'altra config
    if (!enabledConfig || !enabledConfig.state) {
      return res.json({
        success: true,
        data: {
          function: 'paypal_email',
          state: false,
          value: '',
          updated_at: new Date()
        }
      });
    }
    
    // Se invece paypal_enabled è true, procediamo normalmente con la config dell'email
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
    
    // Imposta header per prevenire il caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
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
      data: response,
      timestamp: Date.now() // Aggiungiamo un timestamp per forzare il client a ricaricare
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

// Public route to get system default language
router.get('/system-language', async (req, res) => {
  try {
    const config = await Config.findOne({
      where: { function: 'default_language' }
    });
    
    // If config not found, default to English
    const language = config && config.value ? config.value : 'en';
    
    res.json({
      success: true,
      data: { language }
    });
  } catch (error) {
    console.error('Error retrieving system default language:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving system default language.',
      error: error.message
    });
  }
});

module.exports = router; 