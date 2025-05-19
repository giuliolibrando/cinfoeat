import React, { createContext, useContext, useState, useEffect } from 'react';
import { publicService } from '../services/api';

const ConfigContext = createContext();

export function useConfig() {
  return useContext(ConfigContext);
}

export function ConfigProvider({ children }) {
  const [externalMenuConfig, setExternalMenuConfig] = useState({ state: false, value: '' });
  const [homeNotes, setHomeNotes] = useState({ state: false, value: '' });
  const [paypalConfig, setPaypalConfig] = useState({ state: false, value: '' });
  const [orderState, setOrderState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      // Non reimpostiamo il loading a true per aggiornamenti successivi
      // per evitare flickering dell'interfaccia
      const isInitialLoad = loading;
      
      // Uso Promise.all per fare tutte le richieste in parallelo
      const [
        externalMenuResponse,
        homeNotesResponse,
        paypalResponse,
        orderStateResponse
      ] = await Promise.all([
        publicService.getExternalMenuConfig().catch(err => {
          console.error('Errore nel caricamento della configurazione menu esterno:', err);
          return { data: { data: externalMenuConfig } }; // Usa il valore corrente in caso di errore
        }),
        publicService.getHomeNotes().catch(err => {
          console.error('Errore nel caricamento delle note home:', err);
          return { data: { data: homeNotes } }; // Usa il valore corrente in caso di errore
        }),
        publicService.getPaypalEmail().catch(err => {
          console.error('Errore nel caricamento della configurazione PayPal:', err);
          return { data: { data: paypalConfig } }; // Usa il valore corrente in caso di errore
        }),
        publicService.getOrderState().catch(err => {
          console.error('Errore nel caricamento dello stato ordini:', err);
          return { data: { data: { state: orderState } } }; // Usa il valore corrente in caso di errore
        })
      ]);

      // Aggiorna i valori solo se sono cambiati
      const newExternalMenuConfig = externalMenuResponse.data.data;
      const newHomeNotes = homeNotesResponse.data.data;
      const newPaypalConfig = paypalResponse.data.data || { state: false, value: '' };
      const newOrderState = orderStateResponse.data.data.state;
      
      // Controlla se lo stato degli ordini è cambiato
      // Facciamo un confronto esplicito per assicurarci che i valori booleani siano confrontati correttamente
      const orderStateChanged = newOrderState !== orderState;
      console.log(`Stato ordini: attuale=${orderState}, nuovo=${newOrderState}, cambiato=${orderStateChanged}`);
      
      if (orderStateChanged) {
        console.log(`Aggiornamento stato ordini da ${orderState} a ${newOrderState}`);
        setOrderState(newOrderState);
      }

      // Aggiornamento degli altri stati
      setExternalMenuConfig(newExternalMenuConfig);
      setHomeNotes(newHomeNotes);
      setPaypalConfig(newPaypalConfig);
      
      setLastUpdate(Date.now());
      if (isInitialLoad) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching configurations:', error);
      if (loading) {
        setLoading(false);
      }
    }
  };

  // Helper function for URL formatting
  const getExternalMenuUrl = (url) => {
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const value = {
    externalMenuConfig,
    homeNotes,
    paypalConfig,
    orderState,
    loading,
    lastUpdate,
    getExternalMenuUrl,
    refreshConfigs: fetchConfigurations
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
} 