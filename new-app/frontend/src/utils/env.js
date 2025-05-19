// Funzione per ottenere le variabili d'ambiente con fallback
const getEnvVar = (key, defaultValue) => {
  return process.env[key] || defaultValue;
};

// Variabili d'ambiente comuni
export const API_URL = getEnvVar('REACT_APP_API_URL', '/api');
export const BACKEND_URL = getEnvVar('REACT_APP_BACKEND_URL', ''); 