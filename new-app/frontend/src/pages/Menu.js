import React, { useState, useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { menuService, userChoiceService, publicService } from '../services';
import { toast } from 'react-hot-toast';
import { useConfig } from '../context/ConfigContext';

const Menu = () => {
  // Get configurations from ConfigContext
  const { 
    externalMenuConfig, 
    orderState: configOrderState, 
    getExternalMenuUrl,
    loading: configLoading 
  } = useConfig();
  
  const [menuOptions, setMenuOptions] = useState([]);
  const [userChoices, setUserChoices] = useState([]);
  const [orderState, setOrderState] = useState(configOrderState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Carica le opzioni del menu
        const menuResponse = await menuService.getAll();
        setMenuOptions(menuResponse.data.data);

        // Carica le scelte dell'utente
        const choicesResponse = await userChoiceService.getUserChoices();
        setUserChoices(choicesResponse.data.data);

        // Usiamo lo stato degli ordini e la configurazione del menu esterno dal ConfigContext
        setOrderState(configOrderState);

        setLoading(false);
      } catch (err) {
        console.error('Errore durante il recupero dei dati:', err);
        setError('Si è verificato un errore durante il recupero dei dati. Riprova più tardi.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChoice = async (optionId) => {
    try {
      const isSelected = userChoices.some((choice) => choice.menuOptionId === optionId);
      
      if (isSelected) {
        // Rimuovi la scelta
        await userChoiceService.delete(optionId);
        setUserChoices(userChoices.filter((choice) => choice.menuOptionId !== optionId));
      } else {
        // Aggiungi la scelta
        const response = await userChoiceService.create({ optionId });
        setUserChoices([...userChoices, response.data.data]);
      }
    } catch (err) {
      console.error('Errore durante la gestione della scelta:', err);
      setError('Si è verificato un errore durante la gestione della scelta. Riprova più tardi.');
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Menu del Giorno</h5>
              {console.log('Stato menu esterno:', externalMenuConfig)}
              {externalMenuConfig.state && (
                <a 
                  href={getExternalMenuUrl(externalMenuConfig.value)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-outline-primary btn-sm"
                >
                  <i className="fas fa-external-link-alt me-2"></i>
                  Menu Esterno
                </a>
              )}
            </div>
            <div className="card-body">
              {error && <Alert variant="danger">{error}</Alert>}
              
              {!orderState ? (
                <Alert variant="warning">
                  Gli ordini sono attualmente chiusi. Riprova più tardi.
                </Alert>
              ) : (
                <div className="row">
                  {menuOptions.map((option) => (
                    <div key={option.id} className="col-md-4 mb-4">
                      <div className="card h-100">
                        <div className="card-body">
                          <h5 className="card-title">{option.item}</h5>
                          <p className="card-text">
                            <small className="text-muted">Prezzo: €{option.price}</small>
                          </p>
                          <button
                            className={`btn ${
                              userChoices.some((choice) => choice.menuOptionId === option.id)
                                ? 'btn-success'
                                : 'btn-outline-primary'
                            }`}
                            onClick={() => handleChoice(option.id)}
                            disabled={!orderState}
                          >
                            {userChoices.some((choice) => choice.menuOptionId === option.id)
                              ? 'Selezionato'
                              : 'Seleziona'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu; 