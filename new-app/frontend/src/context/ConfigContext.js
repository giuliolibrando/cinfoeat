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

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);

      // Fetch external menu configuration
      const externalMenuResponse = await publicService.getExternalMenuConfig();
      setExternalMenuConfig(externalMenuResponse.data.data);

      // Fetch home notes configuration
      const homeNotesResponse = await publicService.getHomeNotes();
      setHomeNotes(homeNotesResponse.data.data);

      // Fetch PayPal configuration
      const paypalResponse = await publicService.getPaypalEmail();
      setPaypalConfig(paypalResponse.data.data || { state: false, value: '' });

      // Fetch order state
      const orderStateResponse = await publicService.getOrderState();
      setOrderState(orderStateResponse.data.data.state);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching configurations:', error);
      setLoading(false);
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
    getExternalMenuUrl,
    refreshConfigs: fetchConfigurations
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
} 