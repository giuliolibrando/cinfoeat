import React, { useState, useEffect, useContext } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Alert,
  Spinner,
  Form,
  Table,
  Modal,
  Tabs,
  Tab,
  Badge,
  Nav,
} from 'react-bootstrap';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
// Importazioni FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faClipboard, 
  faPencil, 
  faTrash, 
  faXmark, 
  faMoneyBill, 
  faEuroSign, 
  faUsers, 
  faStar, 
  faBox, 
  faTrophy, 
  faCreditCard, 
  faPrint, 
  faCheckDouble, 
  faCircleXmark
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';

const Admin = () => {
  const { user } = useAuth();
  const { refreshConfigs } = useConfig();
  const [menuOptions, setMenuOptions] = useState([]);
  const [orderSummary, setOrderSummary] = useState({ users: [], grandTotal: 0 });
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [showEditMenuModal, setShowEditMenuModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [editingChoice, setEditingChoice] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(1);
  const [editingUserName, setEditingUserName] = useState('');
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);
  
  // Stato per tracciare i pagamenti
  const [payments, setPayments] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentComplete, setPaymentComplete] = useState({});
  const [partialChangeGiven, setPartialChangeGiven] = useState({});

  // Stato per nuova opzione menu
  const [newMenuItem, setNewMenuItem] = useState({ item: '', price: '' });
  const [newMenuIsDefault, setNewMenuIsDefault] = useState(false);
  
  // Stato per la modifica di un'opzione menu esistente
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [editedMenuName, setEditedMenuName] = useState('');
  const [editedMenuPrice, setEditedMenuPrice] = useState('');
  const [editedMenuIsDefault, setEditedMenuIsDefault] = useState(false);

  // Stato per nuovo admin
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminDisplayName, setNewAdminDisplayName] = useState('');

  // Stato per notifica personalizzata
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');

  // Stato configurazioni
  const [orderState, setOrderState] = useState(false);
  const [notificationsState, setNotificationsState] = useState(false);

  // Stato per notifica personalizzata simulata
  const [customNotificationTitle, setCustomNotificationTitle] = useState('');
  const [customNotificationBody, setCustomNotificationBody] = useState('');
  const [showCustomNotificationModal, setShowCustomNotificationModal] = useState(false);
  
  // Stato per statistiche
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Stato per gestire il menu esterno
  const [externalMenuEnabled, setExternalMenuEnabled] = useState(false);
  const [externalMenuLink, setExternalMenuLink] = useState('');

  // Stato per gestire le note della home
  const [homeNotesEnabled, setHomeNotesEnabled] = useState(false);
  const [homeNotes, setHomeNotes] = useState('');

  // Stato per la configurazione dell'email PayPal
  const [paypalEmail, setPaypalEmail] = useState({ value: '', state: false });

  // Stato per le configurazioni
  const [configs, setConfigs] = useState({
    paypal_enabled: { state: false, value: '' },
    home_notes_enabled: { state: false, value: '' },
    external_menu_enabled: { state: false, value: '' },
    notifications_enabled: { state: false, value: '' },
    order_state: { state: true, value: '' }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Carica le configurazioni
        try {
          const configsResponse = await api.admin.getConfigs();
          if (configsResponse.data && configsResponse.data.data) {
            // Assicuriamoci che tutte le configurazioni necessarie siano presenti
            const defaultConfigs = {
              paypal_enabled: { state: false, value: '' },
              home_notes_enabled: { state: false, value: '' },
              external_menu_enabled: { state: false, value: '' },
              notifications_enabled: { state: false, value: '' },
              order_state: { state: true, value: '' }
            };

            // Unisci le configurazioni di default con quelle ricevute dal server
            const mergedConfigs = {
              ...defaultConfigs,
              ...configsResponse.data.data
            };

            // Assicuriamoci che ogni configurazione abbia state e value
            Object.keys(mergedConfigs).forEach(key => {
              if (!mergedConfigs[key]) {
                mergedConfigs[key] = { state: false, value: '' };
              } else if (!mergedConfigs[key].state) {
                mergedConfigs[key].state = false;
              } else if (!mergedConfigs[key].value) {
                mergedConfigs[key].value = '';
              }
            });

            setConfigs(mergedConfigs);
          } else {
            // Inizializza le configurazioni di default
            setConfigs({
              paypal_enabled: { state: false, value: '' },
              home_notes_enabled: { state: false, value: '' },
              external_menu_enabled: { state: false, value: '' },
              notifications_enabled: { state: false, value: '' },
              order_state: { state: true, value: '' }
            });
          }
        } catch (configError) {
          console.error('Errore nel caricamento delle configurazioni:', configError);
          setError('Errore nel caricamento delle configurazioni');
          setConfigs({
            paypal_enabled: { state: false, value: '' },
            home_notes_enabled: { state: false, value: '' },
            external_menu_enabled: { state: false, value: '' },
            notifications_enabled: { state: false, value: '' },
            order_state: { state: true, value: '' }
          });
        }
        
        // Carica le opzioni del menu
        try {
          const menuResponse = await api.menu.getAll();
          console.log('Menu response:', menuResponse);
          
          let menuData;
          if (menuResponse.data?.data?.options) {
            menuData = menuResponse.data.data.options;
          } else if (menuResponse.data?.options) {
            menuData = menuResponse.data.options;
          } else if (Array.isArray(menuResponse.data)) {
            menuData = menuResponse.data;
          } else if (Array.isArray(menuResponse.data?.data)) {
            menuData = menuResponse.data.data;
          } else {
            menuData = [];
          }
          
          console.log('Menu data estratti:', menuData);
          setMenuOptions(menuData);
        } catch (menuError) {
          console.error('Errore nel caricamento del menu:', menuError);
          setError('Errore nel caricamento del menu');
          setMenuOptions([]);
        }

        // Carica il riepilogo degli ordini
        const orderSummaryResponse = await api.userChoice.getSummary();
        setOrderSummary(orderSummaryResponse.data.data);
        
        // Carica lo storico ordini
        try {
          setLoadingHistory(true);
          const historyResponse = await api.menu.getHistoryOrders();
          setOrderHistory(historyResponse.data.data);
          // Calcola le statistiche usando lo storico
          calculateStats(historyResponse.data.data);
        } catch (historyError) {
          console.error('Errore nel caricamento dello storico:', historyError);
        } finally {
          setLoadingHistory(false);
        }

        // Carica gli amministratori
        const adminsResponse = await api.admin.getAdmins();
        setAdmins(adminsResponse.data.data);

        // Carica i dati dei pagamenti dal database
        try {
          const paymentsResponse = await api.payment.getAll();
          const paymentsData = {};
          const paymentsCompleteData = {};
          const partialChangeGivenData = {};
          
          // Handle both possible response formats
          const payments = Array.isArray(paymentsResponse.data) ? paymentsResponse.data :
                         Array.isArray(paymentsResponse.data.data) ? paymentsResponse.data.data : [];
          
          console.log('Payments data structure:', payments);
          
          payments.forEach(payment => {
            paymentsData[payment.username] = {
              amountPaid: payment.amount_paid,
              totalAmount: payment.total_amount,
              change: payment.change_amount,
              partial_change_given: payment.partial_change_given || 0,
              completed: payment.is_completed
            };
            paymentsCompleteData[payment.username] = payment.is_completed;
            partialChangeGivenData[payment.username] = payment.partial_change_given || 0;
          });
          
          setPayments(paymentsData);
          setPaymentComplete(paymentsCompleteData);
          setPartialChangeGiven(partialChangeGivenData);
          console.log('Pagamenti caricati dal database:', paymentsData);
        } catch (e) {
          console.error('Errore nel caricamento dei pagamenti dal database:', e);
          console.log('Response data structure:', e.response?.data);
          
          // Carica i dati dei pagamenti dal localStorage come fallback
          const savedPayments = localStorage.getItem('cinfoeat_payments');
          if (savedPayments) {
            try {
              const parsedPayments = JSON.parse(savedPayments);
              setPayments(parsedPayments.payments || {});
              setPaymentComplete(parsedPayments.paymentComplete || {});
              setPartialChangeGiven(parsedPayments.partialChangeGiven || {});
              console.log('Pagamenti caricati dal localStorage (fallback)');
            } catch (e) {
              console.error('Errore nel parsing dei dati di pagamento:', e);
              // Initialize empty states as last resort
              setPayments({});
              setPaymentComplete({});
              setPartialChangeGiven({});
            }
          }
        }

        // Carica lo stato degli ordini
        try {
          console.log('Requesting order state in Admin page');
          const orderStateResponse = await api.admin.getConfig('order_state');
          console.log('Order state response in Admin:', orderStateResponse);
          setOrderState(orderStateResponse.data.data.state);
        } catch (orderStateError) {
          console.error('Failed to get order state:', orderStateError);
          // Non impostiamo più un fallback automatico
          setOrderState(false);
        }

        // Carica lo stato delle notifiche
        try {
          console.log('Requesting notifications state');
          const notificationsStateResponse = await api.admin.getConfig('notifications_state');
          console.log('Notifications state response:', notificationsStateResponse);
          setNotificationsState(notificationsStateResponse.data.data.state);
        } catch (notificationsStateError) {
          console.error('Failed to get notifications state:', notificationsStateError);
        }

        // Carica la configurazione del menu esterno
        try {
          const externalMenuResponse = await api.admin.getConfig('external_menu_link');
          setExternalMenuEnabled(externalMenuResponse.data.data.state);
          setExternalMenuLink(externalMenuResponse.data.data.value || '');
        } catch (error) {
          console.error('Errore nel caricamento della configurazione del menu esterno:', error);
        }

        // Carica la configurazione delle note della home
        try {
          const homeNotesResponse = await api.admin.getConfig('home_notes');
          setHomeNotesEnabled(homeNotesResponse.data.data.state);
          setHomeNotes(homeNotesResponse.data.data.value || '');
        } catch (error) {
          console.error('Errore nel caricamento delle note della home:', error);
        }

        // Carica la configurazione PayPal
        try {
          console.log('Requesting PayPal configuration');
          const paypalResponse = await api.admin.getConfig('paypal_email');
          console.log('PayPal configuration response:', paypalResponse);
          setPaypalEmail({
            state: paypalResponse.data.data.state,
            value: paypalResponse.data.data.value || ''
          });
        } catch (error) {
          console.error('Errore nel caricamento della configurazione PayPal:', error);
          setPaypalEmail({ state: false, value: '' });
        }

        setLoading(false);
      } catch (err) {
        console.error('Errore durante il recupero dei dati:', err);
        setError('Si è verificato un errore durante il recupero dei dati. Riprova più tardi.');
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Aggiungi un useEffect per salvare i pagamenti nel localStorage quando cambiano
  useEffect(() => {
    // Salva i dati dei pagamenti nel localStorage
    localStorage.setItem('cinfoeat_payments', JSON.stringify({
      payments,
      paymentComplete,
      partialChangeGiven
    }));
  }, [payments, paymentComplete, partialChangeGiven]);

  // Aggiungi un useEffect per calcolare le statistiche quando cambia orderHistory
  useEffect(() => {
    if (orderHistory && orderHistory.length > 0) {
      calculateStats(orderHistory);
    }
  }, [orderHistory]);

  // Funzioni per gestire le opzioni del menu
  const handleAddMenuItem = async () => {
    try {
      // Validazione input
      if (!newMenuItem.item || !newMenuItem.price) {
        toast.error('Nome e prezzo sono obbligatori');
        return;
      }

      const priceNum = parseFloat(newMenuItem.price);
      if (isNaN(priceNum) || priceNum < 0) {
        toast.error('Il prezzo deve essere un numero positivo');
        return;
      }

      // Preparazione dati
      const menuData = {
        item: newMenuItem.item,
        price: priceNum,
        flag_isdefault: newMenuIsDefault,
        date: new Date().toISOString().split('T')[0]
      };

      console.log('Invio richiesta per aggiungere piatto:', menuData);

      // Invio richiesta
      const response = await api.menu.create(menuData);
      console.log('Risposta dal server:', response.data);

      if (response.data?.success) {
        // Aggiorna il menu con le opzioni dalla risposta
        const updatedOptions = response.data.data?.options || [];
        console.log('Aggiornamento menu con opzioni:', updatedOptions);
        setMenuOptions(updatedOptions);
        
        // Reset form
        setNewMenuItem({ item: '', price: '' });
        setNewMenuIsDefault(false);
        setShowAddMenuModal(false);
        
        toast.success('Piatto aggiunto con successo');
      } else {
        throw new Error('Risposta non valida dal server');
      }
    } catch (error) {
      console.error('Errore durante l\'aggiunta del piatto:', error);
      toast.error(error.response?.data?.message || 'Errore durante l\'aggiunta del piatto');
    }
  };

  const handleEditMenuItem = (option) => {
    setEditingMenuItem(option);
    setEditedMenuName(option.item);
    setEditedMenuPrice(option.price.toString());
    setEditedMenuIsDefault(option.flag_isdefault);
    setShowEditMenuModal(true);
  };

  const handleSaveEditMenuItem = async () => {
    try {
      if (!editedMenuName || !editedMenuPrice) {
        setError('Nome e prezzo sono obbligatori.');
        return;
      }

      await api.menu.update(editingMenuItem.id, {
        item: editedMenuName,
        price: parseFloat(editedMenuPrice),
        flag_isdefault: editedMenuIsDefault,
      });

      // Aggiorna la lista delle opzioni
      const menuResponse = await api.menu.getAll();
      setMenuOptions(menuResponse.data.data.options || []);

      // Resetta il form e chiudi il modal
      setEditingMenuItem(null);
      setEditedMenuName('');
      setEditedMenuPrice('');
      setEditedMenuIsDefault(false);
      setShowEditMenuModal(false);
      toast.success('Piatto modificato con successo');
    } catch (err) {
      console.error('Errore durante la modifica dell\'opzione menu:', err);
      setError('Si è verificato un errore durante la modifica dell\'opzione menu.');
      toast.error('Errore durante la modifica del piatto');
    }
  };

  const handleDeleteMenuItem = async (id) => {
    try {
      await api.menu.delete(id);

      // Aggiorna la lista delle opzioni
      const menuResponse = await api.menu.getAll();
      setMenuOptions(menuResponse.data.data.options || []);
      toast.success('Piatto eliminato con successo');
    } catch (err) {
      console.error('Errore durante l\'eliminazione dell\'opzione menu:', err);
      toast.error('Si è verificato un errore durante l\'eliminazione dell\'opzione menu.');
    }
  };

  // Funzioni per gestire gli amministratori
  const handleAddAdmin = async () => {
    try {
      if (!newAdminUsername) {
        setError('Username è obbligatorio.');
        return;
      }

      await api.admin.addAdmin({
        username: newAdminUsername
      });

      // Aggiorna la lista degli amministratori
      const adminsResponse = await api.admin.getAdmins();
      setAdmins(adminsResponse.data.data);

      // Resetta il form
      setNewAdminUsername('');
      setNewAdminDisplayName('');
      setShowAddAdminModal(false);
    } catch (err) {
      console.error('Errore durante l\'aggiunta dell\'amministratore:', err);
      setError('Si è verificato un errore durante l\'aggiunta dell\'amministratore.');
    }
  };

  const handleDeleteAdmin = async (id) => {
    try {
      await api.admin.removeAdmin(id);

      // Aggiorna la lista degli amministratori
      const adminsResponse = await api.admin.getAdmins();
      setAdmins(adminsResponse.data.data);
    } catch (err) {
      console.error('Errore durante l\'eliminazione dell\'amministratore:', err);
      setError('Si è verificato un errore durante l\'eliminazione dell\'amministratore.');
    }
  };

  // Funzioni per gestire le configurazioni
  const handleToggleOrderState = async () => {
    try {
      console.log('Attempting to toggle order state to:', !orderState);
      await api.admin.updateConfig('order_state', !orderState);
      setOrderState(!orderState);
    } catch (error) {
      console.error('Failed to toggle order state:', error);
      setError('Impossibile modificare lo stato degli ordini. Riprova più tardi.');
    }
  };

  const handleToggleNotificationsState = async () => {
    try {
      console.log('Attempting to toggle notifications state to:', !notificationsState);
      await api.admin.updateConfig('notifications_state', !notificationsState);
      setNotificationsState(!notificationsState);
    } catch (error) {
      console.error('Failed to toggle notifications state:', error);
      setError('Impossibile modificare lo stato delle notifiche. Riprova più tardi.');
    }
  };

  const handleDeleteAllChoices = async () => {
    if (window.confirm('Sei sicuro di voler eliminare tutte le scelte degli utenti?')) {
      try {
        await api.userChoice.deleteAll();
        
        // Aggiorna il riepilogo degli ordini
        const orderSummaryResponse = await api.userChoice.getSummary();
        setOrderSummary(orderSummaryResponse.data.data);
      } catch (err) {
        console.error('Errore durante l\'eliminazione di tutte le scelte:', err);
        setError('Si è verificato un errore durante l\'eliminazione di tutte le scelte.');
      }
    }
  };

  // Funzioni per le notifiche
  const handleSendLunchNotification = async () => {
    try {
      await api.admin.notifyLunchArrived();
      alert('Notifica "Pranzo arrivato" inviata con successo!');
    } catch (err) {
      console.error('Errore durante l\'invio della notifica:', err);
      setError('Si è verificato un errore durante l\'invio della notifica.');
    }
  };

  const handleSendCustomNotification = async () => {
    try {
      if (!notificationTitle || !notificationBody) {
        setError('Titolo e messaggio sono obbligatori.');
        return;
      }

      await api.admin.sendCustomNotification({
        title: notificationTitle,
        body: notificationBody,
      });

      // Resetta il form
      setNotificationTitle('');
      setNotificationBody('');
      setShowNotificationModal(false);
      alert('Notifica personalizzata inviata con successo!');
    } catch (err) {
      console.error('Errore durante l\'invio della notifica personalizzata:', err);
      setError('Si è verificato un errore durante l\'invio della notifica personalizzata.');
    }
  };

  // Nella sezione delle notifiche personalizzate, aggiungi l'opzione per mostrare una notifica simulata
  const handleShowSimulatedNotification = () => {
    const title = customNotificationTitle || 'Notifica CinfoEat';
    const body = customNotificationBody || 'Nuova notifica dal sistema';
    
    // Verifica se le notifiche sono supportate
    if ('Notification' in window) {
      // Chiedi il permesso se non è ancora stato concesso
      if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            showBrowserNotification(title, body);
          }
        });
      } else {
        // Mostra la notifica se il permesso è già stato concesso
        showBrowserNotification(title, body);
      }
    } else {
      alert('Il tuo browser non supporta le notifiche desktop');
    }
  };

  // Funzione per mostrare una notifica direttamente dal browser
  const showBrowserNotification = (title, body) => {
    const notification = new Notification(title, {
      body: body,
      icon: '/favicon.ico',
      tag: 'cinfoeat-notification'
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    setCustomNotificationTitle('');
    setCustomNotificationBody('');
    setShowCustomNotificationModal(false);
  };

  const handleCopyOrdersToClipboard = () => {
    // Crea un testo formattato con tutti gli ordini nel formato richiesto
    let clipboardText = "";
    
    orderSummary.users.forEach(user => {
      user.choices.forEach(choice => {
        clipboardText += `${choice.quantity}x ${choice.item}\n`;
      });
    });
    
    // Funzione di fallback per la copia
    const fallbackCopyTextToClipboard = (text) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Make the textarea out of viewport
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if(successful) {
          alert('Riepilogo ordini copiato negli appunti!');
        } else {
          alert('Operazione di copia non riuscita');
        }
      } catch (err) {
        console.error('Errore durante la copia negli appunti:', err);
        alert('Impossibile copiare negli appunti: ' + err);
      }
      
      document.body.removeChild(textArea);
    };
    
    // Tenta di usare l'API Clipboard, con fallback al metodo vecchio
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(clipboardText)
        .then(() => {
          alert('Riepilogo ordini copiato negli appunti!');
        })
        .catch(err => {
          console.error('Errore durante la copia negli appunti:', err);
          // Usa il metodo di fallback se l'API Clipboard fallisce
          fallbackCopyTextToClipboard(clipboardText);
        });
    } else {
      // Usa il metodo di fallback se l'API Clipboard non è disponibile
      fallbackCopyTextToClipboard(clipboardText);
    }
  };

  const handleCopyUserOrderToClipboard = (userSummary) => {
    // Crea un testo formattato con l'ordine dell'utente nel formato richiesto
    let clipboardText = "";
    
    userSummary.choices.forEach(choice => {
      clipboardText += `${choice.quantity}x ${choice.item}\n`;
    });
    
    // Funzione di fallback per la copia
    const fallbackCopyTextToClipboard = (text) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Make the textarea out of viewport
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if(successful) {
          alert(`Ordine di ${userSummary.display_name} copiato negli appunti!`);
        } else {
          alert('Operazione di copia non riuscita');
        }
      } catch (err) {
        console.error('Errore durante la copia negli appunti:', err);
        alert('Impossibile copiare negli appunti: ' + err);
      }
      
      document.body.removeChild(textArea);
    };
    
    // Tenta di usare l'API Clipboard, con fallback al metodo vecchio
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(clipboardText)
        .then(() => {
          alert(`Ordine di ${userSummary.display_name} copiato negli appunti!`);
        })
        .catch(err => {
          console.error('Errore durante la copia negli appunti:', err);
          // Usa il metodo di fallback se l'API Clipboard fallisce
          fallbackCopyTextToClipboard(clipboardText);
        });
    } else {
      // Usa il metodo di fallback se l'API Clipboard non è disponibile
      fallbackCopyTextToClipboard(clipboardText);
    }
  };

  const handleOpenEditOrderModal = (choice, userName) => {
    setEditingChoice(choice);
    setEditingQuantity(choice.quantity);
    setEditingUserName(userName);
    setShowEditOrderModal(true);
  };

  const handleSaveEditOrder = async () => {
    try {
      console.log('Modifica ordine:', editingChoice.id, editingQuantity);
      
      // Utilizzo diretto di axios invece del service wrapper
      const apiUrl = '/choices/' + editingChoice.id + '/admin';
      console.log('Chiamata diretta a:', apiUrl, 'con dati:', { quantity: editingQuantity });
      
      // Importa l'istanza axios dal file api.js
      const { axiosInstance } = require('../services/api');
      
      // Chiamata diretta con axios
      const response = await axiosInstance.put(apiUrl, { quantity: editingQuantity });
      console.log('Risposta dalla modifica ordine:', response);
      
      // Aggiorna il riepilogo degli ordini
      const orderSummaryResponse = await api.getSummary();
      setOrderSummary(orderSummaryResponse.data.data);
      
      setShowEditOrderModal(false);
      setEditingChoice(null);
    } catch (err) {
      console.error('Errore durante la modifica dell\'ordine:', err);
      setError('Si è verificato un errore durante la modifica dell\'ordine: ' + err.message);
    }
  };

  const handleAdminDeleteChoice = async (choiceId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo ordine?')) {
      try {
        console.log('Eliminazione ordine:', choiceId);
        
        // Utilizzo diretto di axios invece del service wrapper
        const apiUrl = '/choices/' + choiceId + '/admin';
        console.log('Chiamata diretta a:', apiUrl);
        
        // Importa l'istanza axios dal file api.js
        const { axiosInstance } = require('../services/api');
        
        // Chiamata diretta con axios
        const response = await axiosInstance.delete(apiUrl);
        console.log('Risposta dalla eliminazione ordine:', response);
        
        // Aggiorna il riepilogo degli ordini
        const orderSummaryResponse = await api.getSummary();
        setOrderSummary(orderSummaryResponse.data.data);
      } catch (err) {
        console.error('Errore durante l\'eliminazione dell\'ordine:', err);
        setError('Si è verificato un errore durante l\'eliminazione dell\'ordine: ' + err.message);
      }
    }
  };

  // Funzioni per la gestione dei pagamenti
  const handleOpenPaymentModal = (userSummary) => {
    setSelectedUser(userSummary);
    
    // Recupera eventuali dati di pagamento precedenti per questo utente
    const userPayment = payments[userSummary.username] || { amountPaid: '', completed: false, partial_change_given: 0 };
    setAmountPaid(userPayment.amountPaid.toString());
    
    // Imposta lo stato del checkbox in base ai dati esistenti
    setPaymentComplete(prev => ({
      ...prev,
      [userSummary.username]: userPayment.completed || false
    }));
    
    // Imposta il resto parziale
    setPartialChangeGiven(prev => ({
      ...prev,
      [userSummary.username]: userPayment.partial_change_given || 0
    }));
    
    setShowPaymentModal(true);
  };

  const handleSavePayment = async () => {
    try {
      if (!selectedUser || !amountPaid) {
        toast.error('Seleziona un utente e inserisci l\'importo pagato');
        return;
      }

      const totalAmount = orderSummary.users.find(u => u.username === selectedUser.username)?.total || 0;
      const displayName = orderSummary.users.find(u => u.username === selectedUser.username)?.display_name || selectedUser.username;
      const username = selectedUser.username;
      const isCompleted = paymentComplete[username] || false;
      const partialChange = partialChangeGiven[username] || 0;
      
      // Controlla se esiste già un pagamento per questo utente
      const existingPayment = payments[username];
      let response;
      
      if (existingPayment) {
        // Aggiorna il pagamento esistente
        console.log('Aggiornamento pagamento esistente per:', username);
        response = await api.payment.update(username, {
          amount_paid: parseFloat(amountPaid),
          total_amount: totalAmount,
          is_completed: isCompleted,
          partial_change_given: partialChange
        });
      } else {
        // Crea un nuovo pagamento
        console.log('Creazione nuovo pagamento per:', username);
        response = await api.payment.create({
          username: username,
          display_name: displayName,
          amount_paid: parseFloat(amountPaid),
          total_amount: totalAmount,
          is_completed: isCompleted,
          partial_change_given: partialChange
        });
      }

      console.log('Risposta salvataggio pagamento:', response);

      // Aggiorna lo stato locale
      setPayments(prev => ({
        ...prev,
        [username]: {
          amountPaid: parseFloat(amountPaid),
          totalAmount: totalAmount,
          change: Math.max(0, parseFloat(amountPaid) - totalAmount),
          partial_change_given: partialChange,
          completed: isCompleted
        }
      }));

      // Aggiorna i dati locali
      const fetchUpdatedPayments = async () => {
        try {
          const paymentsResponse = await api.payment.getAll();
          console.log('Pagamenti aggiornati:', paymentsResponse.data);
        } catch (err) {
          console.error('Errore nel refresh dei pagamenti:', err);
        }
      };
      
      // Aggiorna i dati dopo il salvataggio
      fetchUpdatedPayments();

      toast.success('Pagamento salvato con successo');
      setShowPaymentModal(false);
      setAmountPaid('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Errore durante il salvataggio del pagamento:', error);
      toast.error('Errore durante il salvataggio del pagamento');
    }
  };

  const handleClearPayment = async (username) => {
    try {
      // Rimuovi i dati di pagamento per questo utente
      const newPayments = { ...payments };
      delete newPayments[username];
      setPayments(newPayments);

      // Rimuovi dallo stato dei pagamenti completati
      const newCompleted = { ...paymentComplete };
      delete newCompleted[username];
      setPaymentComplete(newCompleted);
      
      // Rimuovi dallo stato dei resti parziali
      const newPartialChangeGiven = { ...partialChangeGiven };
      delete newPartialChangeGiven[username];
      setPartialChangeGiven(newPartialChangeGiven);
      
      // Elimina il pagamento dal database
      await api.payment.delete(username);
      
      alert('Pagamento eliminato con successo!');
    } catch (err) {
      console.error('Errore durante l\'eliminazione del pagamento:', err);
      setError('Si è verificato un errore durante l\'eliminazione del pagamento: ' + err.message);
    }
  };

  const handleClearAllPayments = async () => {
    try {
      await api.payment.deleteAll();
      setPayments({});
      setPaymentComplete({});
      setPartialChangeGiven({});
      alert('Tutti i pagamenti sono stati cancellati con successo.');
    } catch (error) {
      console.error('Errore durante la cancellazione dei pagamenti:', error);
      alert('Si è verificato un errore durante la cancellazione dei pagamenti.');
    }
  };

  const handleResetMenu = async () => {
    if (window.confirm('Sei sicuro di voler azzerare il menu? Tutti gli ordini e i pagamenti verranno eliminati.')) {
      try {
        const response = await api.menu.resetMenu();
        
        // Aggiorna il menu con i dati ricevuti dal backend
        if (response.data?.data?.options) {
          setMenuOptions(response.data.data.options);
        } else {
          // Se non riceviamo i dati, ricarica il menu
          const menuResponse = await api.menu.getAll();
          if (menuResponse.data?.data?.options) {
            setMenuOptions(menuResponse.data.data.options);
          }
        }
        
        setOrderSummary({ users: [], grandTotal: 0 });
        
        // Pulisci i dati dei pagamenti dal localStorage
        localStorage.removeItem('cinfoeat_payments');
        setPayments({});
        setPaymentComplete({});
        setPartialChangeGiven({});
        
        toast.success('Menu azzerato con successo!');
      } catch (error) {
        console.error('Errore durante l\'azzeramento del menu:', error);
        toast.error('Si è verificato un errore durante l\'azzeramento del menu.');
      }
    }
  };

  const handleToggleExternalMenu = async (checked) => {
    try {
      // Questa funzione controlla solo la visibilità agli utenti (external_menu_link state)
      // La funzionalità (external_menu_enabled) viene gestita dalle Impostazioni
      await api.admin.updateConfig('external_menu_link', checked, externalMenuLink);
      
      // Update local state
      setExternalMenuEnabled(checked);
      
      // Refresh the global config context to update all components
      refreshConfigs();
      
      toast.success(checked ? 'Menu esterno reso visibile agli utenti' : 'Menu esterno nascosto agli utenti');
    } catch (error) {
      console.error('Errore nell\'aggiornamento della configurazione:', error);
      toast.error('Errore nell\'aggiornamento della configurazione');
    }
  };

  const handleUpdateExternalMenuLink = async () => {
    try {
      // Aggiorna solo il valore dell'URL mantenendo lo stato di visibilità corrente
      await api.admin.updateConfig('external_menu_link', externalMenuEnabled, externalMenuLink);
      
      // Refresh the global config context to update all components
      refreshConfigs();
      
      toast.success('Link del menu esterno aggiornato con successo');
    } catch (err) {
      console.error('Errore durante l\'aggiornamento del link del menu esterno:', err);
      toast.error('Errore durante l\'aggiornamento del link del menu esterno');
    }
  };

  const handleToggleHomeNotes = async (checked) => {
    try {
      await api.admin.updateConfig('home_notes', checked, homeNotes);
      setHomeNotesEnabled(checked);
      
      // Refresh the global config context to update all components
      refreshConfigs();
      
      toast.success('Configurazione aggiornata con successo');
    } catch (error) {
      console.error('Errore nell\'aggiornamento della configurazione:', error);
      toast.error('Errore nell\'aggiornamento della configurazione');
    }
  };

  const handleUpdateHomeNotes = async () => {
    try {
      await api.admin.updateConfig('home_notes', homeNotesEnabled, homeNotes);
      
      // Refresh the global config context to update all components
      refreshConfigs();
      
      toast.success('Note aggiornate con successo');
    } catch (err) {
      console.error('Errore durante l\'aggiornamento delle note:', err);
      toast.error('Errore durante l\'aggiornamento delle note');
    }
  };

  const handleConfigUpdate = async (configType, state, value) => {
    try {
      await api.admin.updateConfig(configType, state, value);
      
      // Refresh the global config context to update all components
      refreshConfigs();
      
      toast.success('Configurazione aggiornata con successo');
    } catch (error) {
      console.error('Errore nell\'aggiornamento della configurazione:', error);
      toast.error('Errore nell\'aggiornamento della configurazione');
    }
  };

  const handleUpdateConfig = async (functionName, state, value = '') => {
    try {
      // Gestione speciale per external_menu_enabled (impostazione a livello di sistema)
      if (functionName === 'external_menu_enabled') {
        // Aggiorna l'impostazione di sistema
        await api.admin.updateConfig('external_menu_enabled', state, value);
        
        // Aggiorna lo stato locale nelle configurazioni
        setConfigs(prev => ({
          ...prev,
          [functionName]: { state, value }
        }));
        
        // Se disabilitiamo la funzione a livello di sistema, dobbiamo anche
        // nascondere il menu agli utenti (ma non cancellare il link salvato)
        if (!state) {
          // Otteniamo il link corrente prima
          const currentLink = externalMenuLink;
          
          // Aggiorniamo external_menu_link impostando state=false ma mantenendo il valore
          await api.admin.updateConfig('external_menu_link', false, currentLink);
          
          // Aggiorniamo lo stato locale
          setExternalMenuEnabled(false);
          
          console.log(`Menu esterno disabilitato a livello di sistema`);
        } else {
          console.log(`Menu esterno abilitato a livello di sistema`);
        }
        
        // Refresh global configs
        refreshConfigs();
      }
      // Gestione speciale per paypal_enabled (impostazione a livello di sistema)
      else if (functionName === 'paypal_enabled') {
        // Aggiorna l'impostazione di sistema
        await api.admin.updateConfig('paypal_enabled', state, value);
        
        // Aggiorna lo stato locale
        setConfigs(prev => ({
          ...prev,
          [functionName]: { state, value }
        }));
        
        // Se disabilitiamo la funzione a livello di sistema, dobbiamo anche
        // disattivare l'email PayPal (ma manteniamo il valore salvato)
        if (!state) {
          // Otteniamo il valore dell'email attuale
          const currentEmail = paypalEmail.value;
          
          // Aggiorniamo paypal_email impostando state=false ma mantenendo il valore
          await api.admin.updateConfig('paypal_email', false, currentEmail);
          
          // Aggiorniamo lo stato locale
          setPaypalEmail(prev => ({
            ...prev,
            state: false
          }));
          
          console.log(`Pagamenti PayPal disabilitati a livello di sistema`);
        } else {
          console.log(`Pagamenti PayPal abilitati a livello di sistema`);
        }
        
        // Refresh global configs
        refreshConfigs();
      } else {
        // Comportamento standard per altre configurazioni
        await api.admin.updateConfigs(functionName, state, value);
        setConfigs(prev => ({
          ...prev,
          [functionName]: { state, value }
        }));
        
        // Refresh the global config context to update all components
        refreshConfigs();
      }
      
      toast.success('Configurazione aggiornata con successo');
    } catch (error) {
      console.error('Errore nell\'aggiornamento della configurazione:', error);
      toast.error('Errore nell\'aggiornamento della configurazione');
    }
  };

  // Calcola le statistiche dagli ordini
  const calculateStats = (history) => {
    if (!history || history.length === 0) {
      console.log('Nessuna storia disponibile per il calcolo delle statistiche');
      return;
    }

    try {
      console.log('Calcolo statistiche su:', history);
      
      // Calcola il totale degli ordini
      const totalOrders = history.reduce((sum, day) => {
        const orders = parseInt(day.numOrders || 0);
        return sum + orders;
      }, 0);
      
      // Calcola il totale degli utenti unici
      const totalUsers = history.reduce((sum, day) => {
        const users = parseInt(day.numUsers || 0);
        return sum + users;
      }, 0);
      
      // Calcola il totale degli incassi
      const totalRevenue = history.reduce((sum, day) => {
        const revenue = parseFloat(day.totalAmount || 0);
        return sum + revenue;
      }, 0);

      // Calcola le medie giornaliere
      const numDays = history.length;
      const avgOrders = totalOrders / numDays;
      const avgUsers = totalUsers / numDays;
      const avgRevenue = totalRevenue / numDays;

      // Calcola il giorno con più ordini
      const maxOrdersDay = history.reduce((max, day) => {
        return (parseInt(day.numOrders || 0) > parseInt(max.numOrders || 0)) ? day : max;
      }, history[0]);

      // Calcola il giorno con più utenti
      const maxUsersDay = history.reduce((max, day) => {
        return (parseInt(day.numUsers || 0) > parseInt(max.numUsers || 0)) ? day : max;
      }, history[0]);

      // Calcola il giorno con più incassi
      const maxRevenueDay = history.reduce((max, day) => {
        return (parseFloat(day.totalAmount || 0) > parseFloat(max.totalAmount || 0)) ? day : max;
      }, history[0]);

      // Calcola gli ordini più popolari
      const popularOrders = {};
      history.forEach(day => {
        day.orders.forEach(order => {
          if (!popularOrders[order.item]) {
            popularOrders[order.item] = {
              total: 0,
              count: 0,
              revenue: 0
            };
          }
          popularOrders[order.item].total += order.quantity;
          popularOrders[order.item].count += 1;
          popularOrders[order.item].revenue += parseFloat(order.total);
        });
      });

      // Ordina gli ordini più popolari
      const sortedPopularOrders = Object.entries(popularOrders)
        .map(([item, data]) => ({
          item,
          ...data
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      console.log('Statistiche calcolate:', {
        totalOrders,
        totalUsers,
        totalRevenue,
        avgOrders,
        avgUsers,
        avgRevenue,
        maxOrdersDay,
        maxUsersDay,
        maxRevenueDay,
        popularOrders: sortedPopularOrders
      });

      setStatsData({
        totalOrders,
        totalUsers,
        totalRevenue,
        avgOrders,
        avgUsers,
        avgRevenue,
        maxOrdersDay,
        maxUsersDay,
        maxRevenueDay,
        popularOrders: sortedPopularOrders
      });
    } catch (error) {
      console.error('Errore nel calcolo delle statistiche:', error);
    }
  };

  // Funzioni per azioni rapide statistiche
  const handleCopyAllOrdersToClipboard = () => {
    try {
      if (!orderSummary || !orderSummary.users || orderSummary.users.length === 0) {
        alert('Nessun ordine da copiare!');
        return;
      }
      
      const { users } = orderSummary;
      let summaryText = `RIEPILOGO ORDINI ${new Date().toLocaleDateString('it-IT')}\n\n`;
      
      users.forEach(user => {
        summaryText += `${user.display_name || user.username}:\n`;
        user.choices.forEach(choice => {
          summaryText += `- ${choice.item} x${choice.quantity}: €${choice.total.toFixed(2)}\n`;
        });
        summaryText += `Totale: €${user.total.toFixed(2)}\n\n`;
      });
      
      summaryText += `TOTALE COMPLESSIVO: €${orderSummary.grandTotal.toFixed(2)}`;
      
      // Funzione di fallback per la copia
      const fallbackCopyTextToClipboard = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Make the textarea out of viewport
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if(successful) {
            alert('Riepilogo copiato negli appunti!');
          } else {
            alert('Operazione di copia non riuscita');
          }
        } catch (err) {
          console.error('Errore durante la copia negli appunti:', err);
          alert('Impossibile copiare negli appunti: ' + err);
        }
        
        document.body.removeChild(textArea);
      };
      
      // Tenta di usare l'API Clipboard, con fallback al metodo vecchio
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summaryText)
          .then(() => {
            alert('Riepilogo copiato negli appunti!');
          })
          .catch(err => {
            console.error('Errore durante la copia negli appunti:', err);
            // Usa il metodo di fallback se l'API Clipboard fallisce
            fallbackCopyTextToClipboard(summaryText);
          });
      } else {
        // Usa il metodo di fallback se l'API Clipboard non è disponibile
        fallbackCopyTextToClipboard(summaryText);
      }
    } catch (error) {
      console.error('Errore durante la copia del riepilogo:', error);
      setError('Si è verificato un errore durante la copia del riepilogo.');
    }
  };
  
  const handleMarkAllPaid = () => {
    if (window.confirm('Sei sicuro di voler segnare tutti gli utenti come pagato?')) {
      try {
        const newPaymentComplete = {};
        const newPayments = {};
        const newPartialChangeGiven = {};
        
        // Marca tutti gli utenti come pagati
        orderSummary.users.forEach(user => {
          newPaymentComplete[user.username] = true;
          newPartialChangeGiven[user.username] = 0;
          newPayments[user.username] = {
            amountPaid: user.total,
            totalAmount: user.total,
            change: 0,
            partial_change_given: 0,
            completed: true
          };
        });
        
        setPaymentComplete(newPaymentComplete);
        setPayments(newPayments);
        setPartialChangeGiven(newPartialChangeGiven);
        
        // Aggiorna le statistiche
        calculateStats(orderSummary);
        
        alert('Tutti gli utenti sono stati segnati come pagati!');
      } catch (error) {
        console.error('Errore durante il segnare tutti come pagati:', error);
        setError('Si è verificato un errore durante la marcatura dei pagamenti.');
      }
    }
  };
  
  const handleExportHistoryToCSV = () => {
    try {
      if (!orderHistory || orderHistory.length === 0) {
        toast.error('Nessun dato storico disponibile per l\'esportazione');
        return;
      }
      
      // Creiamo l'intestazione del CSV
      let csvContent = "STORICO ORDINI CINFOEAT\n\n";
      
      // Aggiungiamo i dati di ogni giorno
      orderHistory.forEach(day => {
        // Aggiungiamo l'intestazione del giorno
        csvContent += `Data: ${new Date(day.date).toLocaleDateString('it-IT')}\n`;
        csvContent += `Numero utenti: ${day.numUsers}\n`;
        csvContent += `Numero ordini: ${day.numOrders}\n`;
        csvContent += `Totale giornaliero: €${day.totalAmount}\n\n`;
        
        // Aggiungiamo l'intestazione della tabella ordini
        csvContent += "Utente,Articolo,Quantità,Prezzo Unitario,Totale\n";
        
        // Aggiungiamo gli ordini del giorno
        day.orders.forEach(order => {
          const row = [
            order.display_name,
            order.item,
            order.quantity,
            `€${order.price}`,
            `€${order.total}`
          ].map(field => `"${field}"`).join(',');
          
          csvContent += row + "\n";
        });
        
        // Aggiungiamo una riga vuota tra i giorni
        csvContent += "\n-------------------\n\n";
      });
      
      // Aggiungiamo statistiche generali
      const totaleComplessivo = orderHistory.reduce((acc, day) => acc + day.totalAmount, 0);
      const totaleOrdini = orderHistory.reduce((acc, day) => acc + day.numOrders, 0);
      const mediaGiornaliera = totaleComplessivo / orderHistory.length;
      
      csvContent += "STATISTICHE GENERALI\n";
      csvContent += `Periodo: dal ${new Date(orderHistory[orderHistory.length - 1].date).toLocaleDateString('it-IT')} al ${new Date(orderHistory[0].date).toLocaleDateString('it-IT')}\n`;
      csvContent += `Totale complessivo: €${totaleComplessivo.toFixed(2)}\n`;
      csvContent += `Numero totale ordini: ${totaleOrdini}\n`;
      csvContent += `Media giornaliera: €${mediaGiornaliera.toFixed(2)}\n`;
      
      // Creiamo un elemento per il download diretto
      const element = document.createElement('a');
      
      // Usiamo una tecnica più compatibile con i browser
      const file = new File([csvContent], 'storico_ordini.csv', {type: 'text/csv'});
      element.href = URL.createObjectURL(file);
      element.download = `storico_ordini_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Aggiungiamo l'elemento al documento e simuliamo il click
      document.body.appendChild(element);
      element.click();
      
      // Rimuoviamo l'elemento dopo un breve ritardo
      setTimeout(() => {
        document.body.removeChild(element);
        URL.revokeObjectURL(element.href); // Libera la memoria
        toast.success('File CSV generato con successo');
      }, 100);
    } catch (error) {
      console.error('Errore durante l\'esportazione dello storico:', error);
      toast.error('Si è verificato un errore durante l\'esportazione dello storico.');
    }
  };
  
  const renderOrderHistory = () => {
    if (loadingHistory) {
      return (
        <div className="text-center my-3">
          <Spinner animation="border" variant="primary" />
          <p>Caricamento storico...</p>
        </div>
      );
    }

    if (!orderHistory.length) {
      return (
        <Alert variant="info">
          Nessuno storico ordini disponibile.
        </Alert>
      );
    }

    return (
      <div>
        <div className="mb-3">
          <Button variant="success" onClick={handleExportHistoryToCSV}>
            <FontAwesomeIcon icon={faClipboard} className="me-2" />
            Esporta CSV
          </Button>
        </div>
        {orderHistory.map((day) => (
          <Card key={day.date} className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Data: {new Date(day.date).toLocaleDateString('it-IT')}</h5>
                <div>
                  <Badge bg="primary" className="me-2">
                    Utenti: {day.numUsers}
                  </Badge>
                  <Badge bg="success" className="me-2">
                    Ordini: {day.numOrders}
                  </Badge>
                  <Badge bg="info">
                    Totale: €{day.totalAmount}
                  </Badge>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Utente</th>
                    <th>Articolo</th>
                    <th>Quantità</th>
                    <th>Prezzo</th>
                    <th>Totale</th>
                  </tr>
                </thead>
                <tbody>
                  {day.orders.map((order, index) => (
                    <tr key={index}>
                      <td>{order.display_name}</td>
                      <td>{order.item}</td>
                      <td>{order.quantity}</td>
                      <td>€{order.price}</td>
                      <td>€{order.total}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        ))}
      </div>
    );
  };

  // Funzione per formattare la data in formato italiano
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </Spinner>
        </div>
      </div>
    );
  }

  if (!configs) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <Alert variant="warning">
            Errore nel caricamento delle configurazioni. Riprova più tardi.
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>Pannello di Amministrazione</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Tabs defaultActiveKey="orders" className="mb-4">
        <Tab eventKey="orders" title="Ordini">
          <div className="admin-section">
            <h3>Gestione Ordini</h3>
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="mb-0">
                    Stato ordini: 
                    <Badge bg={orderState ? 'success' : 'danger'} className="ms-2">
                      {orderState ? 'Aperti' : 'Chiusi'}
                    </Badge>
                  </p>
                </div>
                <Button 
                  variant={orderState ? 'danger' : 'success'}
                  onClick={handleToggleOrderState}
                >
                  {orderState ? 'Chiudi Ordini' : 'Apri Ordini'}
                </Button>
              </div>
            </div>

            <h4>Riepilogo Ordini</h4>
            {orderSummary.users.length === 0 ? (
              <Alert variant="info">Nessun ordine presente.</Alert>
            ) : (
              <>
                <div className="mb-3">
                  <Button variant="secondary" onClick={handleCopyOrdersToClipboard}>
                    <FontAwesomeIcon icon={faClipboard} className="me-1" /> Copia riepilogo negli appunti
                  </Button>
                </div>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Utente</th>
                      <th>Ordini</th>
                      <th>Totale</th>
                      <th>Pagamento</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderSummary.users.map((userSummary) => (
                      <tr key={userSummary.username}>
                        <td>{userSummary.display_name}</td>
                        <td>
                          <ul>
                            {userSummary.choices.map((choice, index) => (
                              <li key={index} className="d-flex align-items-center justify-content-between">
                                <span>{choice.item} x{choice.quantity} - €{parseFloat(choice.total).toFixed(2)}</span>
                                <div className="ms-2">
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    className="me-1"
                                    onClick={() => handleOpenEditOrderModal(choice, userSummary.display_name)}
                                  >
                                    <FontAwesomeIcon icon={faPencil} />
                                  </Button>
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={() => handleAdminDeleteChoice(choice.id)}
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>€{parseFloat(userSummary.total).toFixed(2)}</td>
                        <td>
                          {payments[userSummary.username] ? (
                            <div>
                              <Badge 
                                bg={paymentComplete[userSummary.username] ? "success" : "warning"}
                                className="mb-2 d-block"
                              >
                                {paymentComplete[userSummary.username] ? "Pagato" : "In attesa"}
                              </Badge>
                              <small>
                                Importo: €{parseFloat(payments[userSummary.username].amountPaid).toFixed(2)}<br />
                                Resto: €{Math.max(0, parseFloat(payments[userSummary.username].change)).toFixed(2)}
                                {payments[userSummary.username].change > 0 && (
                                  <>
                                    <br />
                                    Resto dato: €{parseFloat(payments[userSummary.username].partial_change_given || 0).toFixed(2)}
                                    <br />
                                    Resto da dare: €{parseFloat(Math.max(0, payments[userSummary.username].change - (payments[userSummary.username].partial_change_given || 0))).toFixed(2)}
                                  </>
                                )}
                              </small>
                              <div className="mt-2">
                                <Button 
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleOpenPaymentModal(userSummary)}
                                >
                                  <FontAwesomeIcon icon={faPencil} /> Modifica
                                </Button>
                                <Button 
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleClearPayment(userSummary.username)}
                                >
                                  <FontAwesomeIcon icon={faCircleXmark} /> Annulla
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              onClick={() => handleOpenPaymentModal(userSummary)}
                            >
                              <FontAwesomeIcon icon={faMoneyBill} /> Registra
                            </Button>
                          )}
                        </td>
                        <td>
                          <Button 
                            variant="outline-warning" 
                            size="sm" 
                            onClick={() => handleCopyUserOrderToClipboard(userSummary)}
                            className="mb-2 d-block"
                          >
                            <FontAwesomeIcon icon={faClipboard} /> Copia
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2" className="text-end"><strong>Totale Complessivo:</strong></td>
                      <td><strong>€{parseFloat(orderSummary.grandTotal).toFixed(2)}</strong></td>
                    </tr>
                  </tfoot>
                </Table>
                <Button variant="danger" onClick={handleDeleteAllChoices}>
                  Elimina tutti gli ordini
                </Button>
              </>
            )}
          </div>
        </Tab>

        <Tab eventKey="menu" title="Menu">
          <div className="admin-section">
            <h3>Gestione Menu</h3>
            <div className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">Gestione Menu</h5>
                  <p className="text-muted mb-0">Data odierna: {formatDate(today)}</p>
                </div>
                <div>
                  <Button variant="warning" className="me-2" onClick={handleResetMenu}>
                    <FontAwesomeIcon icon={faClipboard} className="me-2" />
                    Azzera Menu
                  </Button>
                  <Button variant="primary" onClick={() => setShowAddMenuModal(true)}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Aggiungi Opzione
                  </Button>
                </div>
              </Card.Header>
            </div>

                        {/* Sezione Menu Esterno - Visibile solo se attivato nelle impostazioni */}
            {configs?.external_menu_enabled?.state && (
              <div className="mb-4">
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Menu Esterno</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h6 className="mb-0">Visibilità Menu Esterno</h6>
                        <p className="text-muted mb-0">Mostra o nascondi il menu esterno agli utenti</p>
                      </div>
                      <Button 
                        variant={externalMenuEnabled ? "danger" : "success"}
                        onClick={() => handleToggleExternalMenu(!externalMenuEnabled)}
                      >
                        {externalMenuEnabled ? "Nascondi agli utenti" : "Mostra agli utenti"}
                      </Button>
                    </div>
                    
                    <div className="mt-4">
                      <Form.Group>
                        <Form.Label>Link Menu Esterno</Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="url"
                            value={externalMenuLink}
                            onChange={(e) => setExternalMenuLink(e.target.value)}
                            placeholder="Inserisci il link al menu esterno"
                          />
                          <Button 
                            variant="primary"
                            onClick={handleUpdateExternalMenuLink}
                          >
                            Aggiorna Link
                          </Button>
                        </div>
                        <Form.Text className="text-muted">
                          Il link verrà mostrato agli utenti solo se la visibilità è attiva
                        </Form.Text>
                      </Form.Group>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            )}

            {/* Sezione Note Home */}
            {configs?.home_notes_enabled?.state && (
              <div className="mb-4">
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Note Home</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h6 className="mb-0">Abilita Note Home</h6>
                        <p className="text-muted mb-0">Mostra note personalizzate nella home page</p>
                      </div>
                      <Button 
                        variant={homeNotesEnabled ? "danger" : "success"}
                        onClick={() => handleToggleHomeNotes(!homeNotesEnabled)}
                      >
                        {homeNotesEnabled ? "Disabilita Note" : "Abilita Note"}
                      </Button>
                    </div>
                    
                    {homeNotesEnabled && (
                      <div className="mt-4">
                        <Form.Group className="mb-3">
                          <Form.Label>Note</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            value={homeNotes}
                            onChange={(e) => setHomeNotes(e.target.value)}
                            placeholder="Inserisci le note da mostrare nella home"
                          />
                        </Form.Group>
                        <Button 
                          variant="primary"
                          onClick={handleUpdateHomeNotes}
                        >
                          Aggiorna Note
                        </Button>
                        <p className="text-muted mt-2 mb-0">
                          Le note verranno mostrate nella home page sopra il menu
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>
            )}

            {/* Sezione Configurazione PayPal - Visibile solo se attivato nelle impostazioni */}
            {configs?.paypal_enabled?.state && (
              <div className="mb-4">
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Configurazione PayPal</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Username PayPal.me</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Inserisci il tuo username PayPal.me"
                        value={paypalEmail.value || ''}
                        onChange={(e) => setPaypalEmail({ ...paypalEmail, value: e.target.value })}
                      />
                      <Form.Check
                        type="switch"
                        label="Mostra pulsante PayPal agli utenti"
                        checked={paypalEmail.state}
                        onChange={(e) => setPaypalEmail({ ...paypalEmail, state: e.target.checked })}
                      />
                    </Form.Group>
                    <Button variant="primary" onClick={() => handleConfigUpdate('paypal_email', paypalEmail.state, paypalEmail.value)}>
                      Salva Configurazione PayPal
                    </Button>
                    <p className="text-muted mt-2 mb-0">
                      Il link di pagamento verrà generato nel formato: https://www.paypal.me/USERNAME/IMPORTO
                    </p>
                  </Card.Body>
                </Card>
              </div>
            )}

            {/* Sezione Configurazione Menu */}
            <Card>
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Configurazione Menu</h5>
                <div>
                  <Button variant="warning" className="me-2" onClick={handleResetMenu}>
                    <FontAwesomeIcon icon={faClipboard} className="me-2" />
                    Azzera Menu
                  </Button>
                  <Button variant="primary" onClick={() => setShowAddMenuModal(true)}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Aggiungi Opzione
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Caricamento...</span>
                    </Spinner>
                  </div>
                ) : menuOptions && menuOptions.length > 0 ? (
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Articolo</th>
                        <th>Prezzo</th>
                        <th>Default</th>
                        <th>Data</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuOptions.map((option) => (
                        <tr key={option.id}>
                          <td>{option.id}</td>
                          <td>{option.item}</td>
                          <td>€{parseFloat(option.price).toFixed(2)}</td>
                          <td>
                            {option.flag_isdefault ? (
                              <Badge bg="success">Sì</Badge>
                            ) : (
                              <Badge bg="secondary">No</Badge>
                            )}
                          </td>
                          <td>{formatDate(option.date)}</td>
                          <td>
                            <Button
                              variant="primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEditMenuItem(option)}
                            >
                              Modifica
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteMenuItem(option.id)}
                            >
                              Elimina
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <Alert variant="info">
                    {error ? `Errore: ${error}` : 'Nessuna opzione menu disponibile per la data odierna.'}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </div>
        </Tab>

        <Tab eventKey="history" title="Storico Ordini">
          <div className="admin-section">
            <h3>Storico Ordini</h3>
            {renderOrderHistory()}
          </div>
        </Tab>

        <Tab eventKey="admins" title="Amministratori">
          <div className="admin-section">
            <h3>Gestione Amministratori</h3>
            <div className="mb-4">
              <Button variant="primary" onClick={() => setShowAddAdminModal(true)}>
                Aggiungi Nuovo Admin
              </Button>
            </div>

            {admins.length === 0 ? (
              <Alert variant="info">Nessun amministratore disponibile.</Alert>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td>{admin.id}</td>
                      <td>{admin.display_name}</td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteAdmin(admin.id)}
                          disabled={admin.display_name === user.displayName} // Non permettere l'auto-eliminazione
                        >
                          Elimina
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Tab>

        <Tab eventKey="notifications" title="Notifiche">
          {configs.notifications_enabled.state ? (
            <div className="admin-section">
              <h3>Gestione Notifiche</h3>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <p className="mb-0">
                      Notifiche: 
                      <Badge bg={notificationsState ? 'success' : 'danger'} className="ms-2">
                        {notificationsState ? 'Attive' : 'Disattivate'}
                      </Badge>
                    </p>
                  </div>
                  <Button
                    variant={notificationsState ? 'danger' : 'success'}
                    onClick={handleToggleNotificationsState}
                  >
                    {notificationsState ? 'Disattiva Notifiche' : 'Attiva Notifiche'}
                  </Button>
                </div>

                <Card className="mb-3">
                  <Card.Body>
                    <Card.Title>Invio Notifiche</Card.Title>
                    <div className="d-flex gap-2 mt-3">
                      <Button
                        variant="success"
                        onClick={handleSendLunchNotification}
                        disabled={!notificationsState}
                      >
                        Invia "Pranzo Arrivato"
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => setShowNotificationModal(true)}
                        disabled={!notificationsState}
                      >
                        Invia Notifica Personalizzata
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          ) : (
            <Alert variant="info">
              Il sistema di notifiche è attualmente disabilitato. Abilitalo nelle Impostazioni per utilizzare questa funzionalità.
            </Alert>
          )}
        </Tab>

        <Tab eventKey="stats" title="Statistiche">
          <div className="admin-section">
            <h3>Statistiche Ordini</h3>
            
            {loadingStats ? (
              <div className="text-center my-3">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Caricamento...</span>
                </Spinner>
              </div>
            ) : statsData ? (
              <Row>
                <Col lg={8}>
                  <Row>
                    <Col md={6} xl={3} className="mb-3">
                      <Card className="h-100 text-center">
                        <Card.Body>
                          <FontAwesomeIcon icon={faEuroSign} className="fs-2 text-primary mb-2" />
                          <h5>Totale Incasso</h5>
                          <h3 className="text-primary">€{(statsData.totalRevenue || 0).toFixed(2)}</h3>
                          <p className="text-muted mb-0">Media: €{(statsData.avgRevenue || 0).toFixed(2)}</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6} xl={3} className="mb-3">
                      <Card className="h-100 text-center">
                        <Card.Body>
                          <FontAwesomeIcon icon={faUsers} className="fs-2 text-success mb-2" />
                          <h5>Utenti Totali</h5>
                          <h3 className="text-success">{statsData.totalUsers || 0}</h3>
                          <p className="text-muted mb-0">Media: {(statsData.avgUsers || 0).toFixed(1)}</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6} xl={3} className="mb-3">
                      <Card className="h-100 text-center">
                        <Card.Body>
                          <FontAwesomeIcon icon={faStar} className="fs-2 text-warning mb-2" />
                          <h5>Totale Ordini</h5>
                          <h3 className="text-warning">{statsData.totalOrders || 0}</h3>
                          <p className="text-muted mb-0">Media: {(statsData.avgOrders || 0).toFixed(1)}</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6} xl={3} className="mb-3">
                      <Card className="h-100 text-center">
                        <Card.Body>
                          <FontAwesomeIcon icon={faBox} className="fs-2 text-info mb-2" />
                          <h5>Ordini per Utente</h5>
                          <h3 className="text-info">{(statsData.totalOrders / statsData.totalUsers || 0).toFixed(1)}</h3>
                          <p className="text-muted mb-0">Media per utente</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Row className="mt-4">
                    <Col md={6} className="mb-4">
                      <Card>
                        <Card.Header>
                          <h5 className="mb-0">Record Giornalieri</h5>
                        </Card.Header>
                        <Card.Body>
                          <div className="mb-3">
                            <h6>Più Ordini</h6>
                            <p className="mb-1">
                              <strong>Data:</strong> {new Date(statsData.maxOrdersDay?.date).toLocaleDateString('it-IT')}
                            </p>
                            <p className="mb-0">
                              <strong>Numero:</strong> {statsData.maxOrdersDay?.numOrders || 0}
                            </p>
                          </div>
                          <div className="mb-3">
                            <h6>Più Utenti</h6>
                            <p className="mb-1">
                              <strong>Data:</strong> {new Date(statsData.maxUsersDay?.date).toLocaleDateString('it-IT')}
                            </p>
                            <p className="mb-0">
                              <strong>Numero:</strong> {statsData.maxUsersDay?.numUsers || 0}
                            </p>
                          </div>
                          <div>
                            <h6>Maggior Incasso</h6>
                            <p className="mb-1">
                              <strong>Data:</strong> {new Date(statsData.maxRevenueDay?.date).toLocaleDateString('it-IT')}
                            </p>
                            <p className="mb-0">
                              <strong>Importo:</strong> €{parseFloat(statsData.maxRevenueDay?.totalAmount || 0).toFixed(2)}
                            </p>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                      <Card>
                        <Card.Header>
                          <h5 className="mb-0">Articoli più Ordinati</h5>
                        </Card.Header>
                        <Card.Body>
                          <Table striped bordered hover size="sm">
                            <thead>
                              <tr>
                                <th>Articolo</th>
                                <th>Quantità</th>
                                <th>Ordini</th>
                                <th>Incasso</th>
                              </tr>
                            </thead>
                            <tbody>
                              {statsData.popularOrders.map((order, index) => (
                                <tr key={index}>
                                  <td>{order.item}</td>
                                  <td>{order.total}</td>
                                  <td>{order.count}</td>
                                  <td>€{order.revenue.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Col>
                <Col lg={4}>
                  <Card className="mb-4">
                    <Card.Header>
                      <h5 className="mb-0">Statistiche Avanzate</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <h6>Valore Medio Ordine</h6>
                        <p className="mb-0">
                          €{(statsData.totalRevenue / statsData.totalOrders || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="mb-3">
                        <h6>Spesa Media per Utente</h6>
                        <p className="mb-0">
                          €{(statsData.totalRevenue / statsData.totalUsers || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="mb-3">
                        <h6>Articoli per Ordine</h6>
                        <p className="mb-0">
                          {(statsData.totalOrders / statsData.totalUsers || 0).toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <h6>Periodo Analizzato</h6>
                        <p className="mb-0">
                          {orderHistory.length} giorni
                        </p>
                      </div>
                    </Card.Body>
                  </Card>

                  <Card className="mb-4">
                    <Card.Header>
                      <h5 className="mb-0">Azioni Rapide</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-grid gap-2">
                        <Button variant="outline-info" onClick={handleExportHistoryToCSV}>
                          <FontAwesomeIcon icon={faPrint} className="me-2" />
                          Esporta CSV
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>

                  <Card>
                    <Card.Header>
                      <h5 className="mb-0">Tendenze</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <h6>Andamento Giornaliero</h6>
                        <p className="mb-0">
                          {orderHistory.length > 1 ? (
                            <span className={statsData.totalRevenue / orderHistory.length > statsData.avgRevenue ? "text-success" : "text-danger"}>
                              {((statsData.totalRevenue / orderHistory.length - statsData.avgRevenue) / statsData.avgRevenue * 100).toFixed(1)}%
                              {statsData.totalRevenue / orderHistory.length > statsData.avgRevenue ? " ↑" : " ↓"}
                            </span>
                          ) : "Dati insufficienti"}
                        </p>
                      </div>
                      <div className="mb-3">
                        <h6>Partecipazione Utenti</h6>
                        <p className="mb-0">
                          {orderHistory.length > 1 ? (
                            <span className={statsData.totalUsers / orderHistory.length > statsData.avgUsers ? "text-success" : "text-danger"}>
                              {((statsData.totalUsers / orderHistory.length - statsData.avgUsers) / statsData.avgUsers * 100).toFixed(1)}%
                              {statsData.totalUsers / orderHistory.length > statsData.avgUsers ? " ↑" : " ↓"}
                            </span>
                          ) : "Dati insufficienti"}
                        </p>
                      </div>
                      <div>
                        <h6>Efficienza Ordini</h6>
                        <p className="mb-0">
                          {orderHistory.length > 1 ? (
                            <span className={statsData.totalOrders / orderHistory.length > statsData.avgOrders ? "text-success" : "text-danger"}>
                              {((statsData.totalOrders / orderHistory.length - statsData.avgOrders) / statsData.avgOrders * 100).toFixed(1)}%
                              {statsData.totalOrders / orderHistory.length > statsData.avgOrders ? " ↑" : " ↓"}
                            </span>
                          ) : "Dati insufficienti"}
                        </p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            ) : (
              <Alert variant="info">
                Non ci sono dati sufficienti per generare statistiche.
              </Alert>
            )}
          </div>
        </Tab>

        <Tab eventKey="settings" title="Impostazioni">
          <div className="admin-section">
            <h3>Configurazione Funzionalità</h3>
            
            <Row>
              <Col md={6}>
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Pagamenti</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="mb-0">Pagamenti PayPal</h6>
                        <p className="text-muted mb-0">Attiva o disattiva completamente i pagamenti tramite PayPal.me</p>
                      </div>
                      <Form.Check
                        type="switch"
                        checked={configs.paypal_enabled.state}
                        onChange={(e) => handleUpdateConfig('paypal_enabled', e.target.checked, configs.paypal_enabled.value)}
                      />
                    </div>
                    <p className="text-muted small mt-2">
                      Se disattivato qui, i pagamenti PayPal non saranno disponibili indipendentemente dalle altre configurazioni
                    </p>
                  </Card.Body>
                </Card>

                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Note Home</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="mb-0">Note nella Home</h6>
                        <p className="text-muted mb-0">Abilita la visualizzazione delle note nella home page</p>
                      </div>
                      <Form.Check
                        type="switch"
                        checked={configs.home_notes_enabled.state}
                        onChange={(e) => handleUpdateConfig('home_notes_enabled', e.target.checked, configs.home_notes_enabled.value)}
                      />
                    </div>
                    <p className="text-muted small mt-2">
                      Se disattivato qui, le note non saranno visibili nella home page indipendentemente dalle altre configurazioni
                    </p>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Menu Esterno</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="mb-0">Funzionalità Menu Esterno</h6>
                        <p className="text-muted mb-0">Attiva o disattiva completamente la funzionalità menu esterno</p>
                      </div>
                      <Form.Check
                        type="switch"
                        checked={configs.external_menu_enabled.state}
                        onChange={(e) => handleUpdateConfig('external_menu_enabled', e.target.checked, configs.external_menu_enabled.value)}
                      />
                    </div>
                    <p className="text-muted small mt-2">
                      Se disattivato qui, il menu esterno non sarà visibile agli utenti indipendentemente dalle configurazioni nella scheda "Menu"
                    </p>
                  </Card.Body>
                </Card>

                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Notifiche</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="mb-0">Sistema di Notifiche</h6>
                        <p className="text-muted mb-0">Abilita l'invio di notifiche agli utenti</p>
                      </div>
                      <Form.Check
                        type="switch"
                        checked={configs.notifications_enabled.state}
                        onChange={(e) => handleUpdateConfig('notifications_enabled', e.target.checked)}
                      />
                    </div>
                    <p className="text-muted small mt-2">
                      Se disattivato qui, non sarà possibile inviare notifiche agli utenti indipendentemente dalle altre configurazioni
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        </Tab>
      </Tabs>

      {/* Modal per aggiungere opzione menu */}
      <Modal show={showAddMenuModal} onHide={() => setShowAddMenuModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Aggiungi Opzione Menu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formMenuItem">
              <Form.Label>Nome Articolo</Form.Label>
              <Form.Control
                type="text"
                placeholder="Inserisci il nome dell'articolo"
                value={newMenuItem.item}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, item: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formMenuPrice">
              <Form.Label>Prezzo</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                placeholder="Inserisci il prezzo"
                value={newMenuItem.price}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formMenuDate">
              <Form.Label>Data</Form.Label>
              <Form.Control
                type="date"
                value={today}
                onChange={(e) => setToday(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formMenuIsDefault">
              <Form.Check
                type="checkbox"
                label="Predefinito"
                checked={newMenuIsDefault}
                onChange={(e) => setNewMenuIsDefault(e.target.checked)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddMenuModal(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleAddMenuItem}>
            Aggiungi
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal per aggiungere amministratore */}
      <Modal show={showAddAdminModal} onHide={() => setShowAddAdminModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Aggiungi Amministratore</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formAdminUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Inserisci l'username dell'amministratore"
                value={newAdminUsername}
                onChange={(e) => setNewAdminUsername(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                Il nome visualizzato verrà recuperato automaticamente da LDAP.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddAdminModal(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleAddAdmin}>
            Aggiungi
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal per notifica personalizzata */}
      <Modal show={showNotificationModal} onHide={() => setShowNotificationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Invia Notifica Personalizzata</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formNotificationTitle">
              <Form.Label>Titolo</Form.Label>
              <Form.Control
                type="text"
                placeholder="Inserisci il titolo della notifica"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formNotificationBody">
              <Form.Label>Messaggio</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Inserisci il messaggio della notifica"
                value={notificationBody}
                onChange={(e) => setNotificationBody(e.target.value)}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNotificationModal(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleSendCustomNotification}>
            Invia
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal per notifica personalizzata simulata */}
      <Modal show={showCustomNotificationModal} onHide={() => setShowCustomNotificationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Invia Notifica Personalizzata</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formCustomNotificationTitle">
              <Form.Label>Titolo</Form.Label>
              <Form.Control
                type="text"
                placeholder="Inserisci il titolo della notifica"
                value={customNotificationTitle}
                onChange={(e) => setCustomNotificationTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formCustomNotificationBody">
              <Form.Label>Messaggio</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Inserisci il messaggio della notifica"
                value={customNotificationBody}
                onChange={(e) => setCustomNotificationBody(e.target.value)}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCustomNotificationModal(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleSendCustomNotification}>
            Invia a tutti
          </Button>
          <Button variant="info" onClick={handleShowSimulatedNotification}>
            Simula notifica locale
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal per modificare la quantità di un ordine */}
      <Modal show={showEditOrderModal} onHide={() => setShowEditOrderModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modifica Ordine</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingChoice && (
            <div>
              <p>
                <strong>Utente:</strong> {editingUserName}
              </p>
              <p>
                <strong>Articolo:</strong> {editingChoice.item}
              </p>
              <p>
                <strong>Prezzo unitario:</strong> €{parseFloat(editingChoice.price).toFixed(2)}
              </p>
              
              <Form.Group className="mb-3" controlId="formQuantity">
                <Form.Label>Quantità</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  placeholder="Inserisci la quantità"
                  value={editingQuantity}
                  onChange={(e) => setEditingQuantity(parseInt(e.target.value) || 1)}
                  required
                />
              </Form.Group>
              
              <p>
                <strong>Totale:</strong> €{parseFloat(editingChoice.price * editingQuantity).toFixed(2)}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditOrderModal(false)}>
            Annulla
          </Button>
          <Button variant="danger" onClick={() => {
            handleAdminDeleteChoice(editingChoice.id);
            setShowEditOrderModal(false);
          }}>
            Elimina
          </Button>
          <Button variant="primary" onClick={handleSaveEditOrder}>
            Salva Modifiche
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal per gestire i pagamenti */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Registra Pagamento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div>
              <p>
                <strong>Utente:</strong> {selectedUser.display_name}
              </p>
              <p>
                <strong>Totale da pagare:</strong> €{parseFloat(selectedUser.total).toFixed(2)}
              </p>
              
              <Form.Group className="mb-3" controlId="formAmountPaid">
                <Form.Label>Importo ricevuto</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Inserisci l'importo ricevuto"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  required
                />
              </Form.Group>
              
              {parseFloat(amountPaid) > 0 && (
                <div className="mb-3">
                  <p>
                    <strong>Resto da dare:</strong> €
                    {Math.max(0, parseFloat(amountPaid) - selectedUser.total).toFixed(2)}
                  </p>

                  {Math.max(0, parseFloat(amountPaid) - selectedUser.total) > 0 && (
                    <div className="mb-3">
                      <p><strong>Gestione del resto:</strong></p>
                      
                      <Form.Group className="mb-2" controlId="formPartialChange">
                        <Form.Label>Resto già dato (parziale)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0"
                          max={Math.max(0, parseFloat(amountPaid) - selectedUser.total)}
                          placeholder="Inserisci l'importo del resto già dato"
                          value={partialChangeGiven[selectedUser.username] || 0}
                          onChange={(e) => {
                            const value = Math.min(
                              parseFloat(e.target.value) || 0,
                              Math.max(0, parseFloat(amountPaid) - selectedUser.total)
                            );
                            setPartialChangeGiven(prev => ({
                              ...prev,
                              [selectedUser.username]: value
                            }));
                          }}
                        />
                      </Form.Group>
                      
                      <p>
                        <strong>Resto ancora da dare:</strong> €
                        {(Math.max(0, parseFloat(amountPaid) - selectedUser.total) - (partialChangeGiven[selectedUser.username] || 0)).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <Form.Check
                    type="checkbox"
                    id="payment-complete"
                    label="Pagamento completato (resto già dato interamente)"
                    checked={paymentComplete[selectedUser.username] || false}
                    onChange={(e) => {
                      setPaymentComplete(prev => ({
                        ...prev, 
                        [selectedUser.username]: e.target.checked
                      }));
                      
                      // Se il pagamento è completato, impostiamo automaticamente il resto parziale come l'intero resto
                      if (e.target.checked) {
                        setPartialChangeGiven(prev => ({
                          ...prev,
                          [selectedUser.username]: Math.max(0, parseFloat(amountPaid) - selectedUser.total)
                        }));
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
            Annulla
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSavePayment}
            disabled={!amountPaid || parseFloat(amountPaid) <= 0}
          >
            Registra Pagamento
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal per modificare opzione menu */}
      <Modal show={showEditMenuModal} onHide={() => setShowEditMenuModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modifica Opzione Menu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formEditMenuItem">
              <Form.Label>Nome Articolo</Form.Label>
              <Form.Control
                type="text"
                placeholder="Inserisci il nome dell'articolo"
                value={editedMenuName}
                onChange={(e) => setEditedMenuName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formEditMenuPrice">
              <Form.Label>Prezzo</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                placeholder="Inserisci il prezzo"
                value={editedMenuPrice}
                onChange={(e) => setEditedMenuPrice(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formEditMenuIsDefault">
              <Form.Check
                type="checkbox"
                label="Predefinito"
                checked={editedMenuIsDefault}
                onChange={(e) => setEditedMenuIsDefault(e.target.checked)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditMenuModal(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleSaveEditMenuItem}>
            Salva Modifiche
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Admin; 
