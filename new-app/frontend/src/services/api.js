import axios from 'axios';
import { API_URL, BACKEND_URL } from '../utils/env';

// Crea un'istanza axios con la baseURL
const axiosInstance = axios.create({
  baseURL: ''
});

// Aggiungi un interceptor per gestire il token di autenticazione
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Aggiungi un interceptor per gestire gli errori di autenticazione
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token non valido o scaduto
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API per l'autenticazione
export const authService = {
  login: (credentials) => axiosInstance.post('/auth/login', credentials),
  me: () => axiosInstance.get('/auth/me'),
  logout: () => axiosInstance.post('/auth/logout')
};

// Funzione per gestire gli errori di autenticazione
export const handleAuthError = (error) => {
  if (error.response) {
    // Il server ha risposto con uno stato di errore
    const { status, data } = error.response;
    
    if (status === 401) {
      // Credenziali non valide
      return data.message || 'Credenziali non valide. Riprova.';
    } else if (status === 403) {
      // Accesso negato
      return data.message || 'Accesso negato. Non hai i permessi necessari.';
    } else if (status === 500) {
      // Errore del server
      return data.message || 'Errore del server. Riprova più tardi.';
    } else {
      // Altri errori
      return data.message || 'Si è verificato un errore durante l\'autenticazione.';
    }
  } else if (error.request) {
    // La richiesta è stata fatta ma non è stata ricevuta una risposta
    return 'Impossibile connettersi al server. Verifica la tua connessione.';
  } else {
    // Errore nella configurazione della richiesta
    return 'Errore nella configurazione della richiesta.';
  }
};

// API per le opzioni del menu
export const menuService = {
  getAll: () => axiosInstance.get('/menu/'),
  create: (data) => axiosInstance.post('/menu/', data),
  update: (id, data) => axiosInstance.put(`/menu/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/menu/${id}/`),
  getHistory: (date) => axiosInstance.get(`/menu/history/${date}/`),
  getHistoryOrders: () => axiosInstance.get('/menu/history-orders/'),
  resetMenu: () => axiosInstance.post('/menu/new-day/')
};

// API per le scelte degli utenti
export const userChoiceService = {
  getUserChoices: () => axiosInstance.get('/choices/user'),
  getUserHistory: () => axiosInstance.get('/choices/user-history'),
  getSummary: () => axiosInstance.get('/choices/summary'),
  create: (data) => axiosInstance.post('/choices/', data),
  update: (id, data) => axiosInstance.put(`/choices/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/choices/${id}/`),
  deleteAll: () => axiosInstance.delete('/choices/all/'),
  getOrderState: () => axiosInstance.get('/choices/order-state'),
  adminDelete: (id) => axiosInstance.delete(`/choices/${id}/admin/`),
  adminUpdate: (id, data) => axiosInstance.put(`/choices/${id}/admin/`, data)
};

// API pubbliche (senza autenticazione)
export const publicService = {
  getOrderState: () => axiosInstance.get('/public/order-state'),
  getAllUserChoices: () => axiosInstance.get('/public/all-user-choices'),
  getExternalMenuConfig: () => axiosInstance.get('/public/external-menu-config'),
  getHomeNotes: () => axiosInstance.get('/public/home-notes'),
  getPaypalEmail: () => axiosInstance.get('/public/paypal-email')
};

// API per le configurazioni e amministrazione
export const adminService = {
  getConfig: (functionName) => axiosInstance.get(`/admin/config/${functionName}`),
  updateConfig: (functionName, state, value = null) => axiosInstance.put(`/admin/config/${functionName}`, { state, value }),
  notifyLunchArrived: () => axiosInstance.post('/admin/notify/lunch-arrived'),
  sendCustomNotification: (data) => axiosInstance.post('/admin/notify/custom', data),
  getAdmins: () => axiosInstance.get('/admin/admins'),
  addAdmin: (data) => axiosInstance.post('/admin/admins', data),
  removeAdmin: (id) => axiosInstance.delete(`/admin/admins/${id}`),
  getConfigs: () => axiosInstance.get('/admin/configs'),
  updateConfigs: (functionName, state, value) => axiosInstance.put(`/admin/configs/${functionName}`, { state, value }),
};

// API per i pagamenti
export const paymentService = {
  getAll: () => axiosInstance.get('/payments/'),
  getUserPayment: () => axiosInstance.get('/payments/user'),
  create: (data) => axiosInstance.post('/payments/', data),
  update: (username, data) => axiosInstance.put(`/payments/${username}`, data),
  delete: (username) => axiosInstance.delete(`/payments/${username}`),
  deleteAll: () => axiosInstance.delete('/payments/all/'),
  markAsPaid: () => axiosInstance.post('/payments/mark-as-paid/')
};

// API per le notifiche push
export const notificationService = {
  getVapidPublicKey: () => axiosInstance.get('/notifications/vapid-public-key'),
  subscribe: (subscription) => axiosInstance.post('/notifications/subscribe', subscription),
  unsubscribe: (endpoint) => axiosInstance.post('/notifications/unsubscribe', { endpoint }),
  testNotification: (subscription) => axiosInstance.post('/notifications/test', subscription),
};

// Export default con tutti i servizi e i metodi HTTP di base
const api = {
  menu: menuService,
  userChoice: userChoiceService,
  public: publicService,
  admin: adminService,
  notification: notificationService,
  payment: paymentService,
  
  // Metodi HTTP di base per utilizzo generico
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, data, config) => axiosInstance.post(url, data, config),
  put: (url, data, config) => axiosInstance.put(url, data, config),
  delete: (url, config) => axiosInstance.delete(url, config)
};

// Esporta anche l'istanza di axios per poterla utilizzare direttamente
export { axiosInstance };

export default api; 
