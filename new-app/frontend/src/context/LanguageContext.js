import React, { createContext, useState, useContext, useEffect } from 'react';
import translations from '../translations';
import { authService } from '../services/api';
import api from '../services/api';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Use localStorage as initial value until we fetch from server
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en';
  });
  
  const [texts, setTexts] = useState(translations[language]);
  
  // On component mount, fetch language preference from server
  useEffect(() => {
    const fetchLanguagePreference = async () => {
      try {
        // SEMPRE prova a caricare la lingua dal server, ignorando localStorage
        const token = localStorage.getItem('token');
        if (token) {
          // User is logged in, use auth service
          const response = await authService.getLanguage();
          if (response.data.success && response.data.data.language) {
            const serverLanguage = response.data.data.language;
            // Aggiorna sempre, indipendentemente da ciò che è in localStorage
            setLanguage(serverLanguage);
            localStorage.setItem('language', serverLanguage);
            console.log('Language set from server:', serverLanguage);
          }
        } else {
          // Not logged in, use public API
          try {
            const sysLangResponse = await api.public.getSystemLanguage();
            if (sysLangResponse.data.success && sysLangResponse.data.data.language) {
              const systemLanguage = sysLangResponse.data.data.language;
              // Aggiorna sempre con la lingua di sistema per gli utenti non loggati
              setLanguage(systemLanguage);
              localStorage.setItem('language', systemLanguage);
              console.log('Language set from system default:', systemLanguage);
            }
          } catch (error) {
            console.error('Error fetching system language preference:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching language preference:', error);
        // Fallback alla lingua salvata in localStorage
      }
    };

    fetchLanguagePreference();
  }, []); // Empty dependency array means this runs once on mount
  
  // Effetto aggiuntivo che si attiva quando l'utente si autentica
  useEffect(() => {
    // Controlla periodicamente il token per rilevare login/logout
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Se è presente un token, controlla la lingua dal server
        authService.getLanguage()
          .then(response => {
            if (response.data.success && response.data.data.language) {
              const serverLanguage = response.data.data.language;
              // Aggiorna sempre alla lingua del server
              setLanguage(serverLanguage);
              localStorage.setItem('language', serverLanguage);
              console.log('Language updated after auth check:', serverLanguage);
            }
          })
          .catch(error => {
            console.error('Error during auth check:', error);
          });
      }
    };
    
    // Esegui immediatamente e poi ogni 5 secondi
    checkAuth();
    const interval = setInterval(checkAuth, 5000);
    
    // Pulisci l'intervallo quando il componente viene smontato
    return () => clearInterval(interval);
  }, []);
  
  // Update texts when language changes
  useEffect(() => {
    setTexts(translations[language]);
    localStorage.setItem('language', language);
  }, [language]);
  
  // Function to change language
  const changeLanguage = async (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('language', lang);
      
      // Save to server if user is logged in
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await authService.setLanguage(lang);
          console.log('Language saved to server:', lang);
        }
      } catch (error) {
        console.error('Error saving language preference to server:', error);
        // Continue anyway as we've already updated locally
      }
    }
  };
  
  return (
    <LanguageContext.Provider value={{ language, texts, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext; 