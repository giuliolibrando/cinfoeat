import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';
import AlertModal from './AlertModal';

const AdminMenu = () => {
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Stati per i modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      console.log('Fetching menu...');
      const response = await axios.get('/api/menu');
      console.log('Menu ricevuto:', response.data);
      if (response.data.success) {
        setMenu(response.data.data);
      } else {
        setError('Errore nel caricamento del menu');
      }
    } catch (error) {
      console.error('Errore nel caricamento del menu:', error);
      setError('Errore nel caricamento del menu');
    }
  };

  const handleResetMenu = async () => {
    setShowConfirmModal(true);
  };

  const confirmResetMenu = async () => {
    try {
      console.log('Iniziando azzeramento menu...');
      const response = await axios.post('/api/menu/new-day');
      console.log('Risposta completa dal server:', response);
      console.log('Dati della risposta:', response.data);
      
      if (response.data && response.data.success) {
        console.log('Menu azzerato con successo, ricaricando menu...');
        // Prima di ricaricare la pagina, aggiorniamo il menu
        await fetchMenu();
        setAlertTitle('Successo');
        setAlertMessage('Menu azzerato con successo!');
        setShowAlertModal(true);
      } else {
        console.error('Errore nella risposta del server:', response.data);
        setAlertTitle('Errore');
        setAlertMessage('Errore durante l\'azzeramento del menu: ' + (response.data?.message || 'Errore sconosciuto'));
        setShowAlertModal(true);
      }
    } catch (error) {
      console.error('Errore durante l\'azzeramento del menu:', error);
      console.error('Dettagli errore:', error.response?.data || error.message);
      setAlertTitle('Errore');
      setAlertMessage('Errore durante l\'azzeramento del menu: ' + (error.response?.data?.message || error.message));
      setShowAlertModal(true);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Gestione Menu</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="mb-4">
        <button 
          className="btn btn-danger" 
          onClick={handleResetMenu}
        >
          Azzera Menu
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Menu Corrente</h3>
        </div>
        <div className="card-body">
          {menu.length === 0 ? (
            <p>Nessun elemento nel menu</p>
          ) : (
            <ul className="list-group">
              {menu.map((item) => (
                <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <span>{item.item}</span>
                  <span className="badge bg-primary rounded-pill">€{item.price}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal di conferma per azzerare il menu */}
      <ConfirmModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={confirmResetMenu}
        title="Conferma azzeramento"
        message="Sei sicuro di voler azzerare il menu? Tutti gli ordini e i pagamenti verranno eliminati."
      />
      
      {/* Modal di alerta per messaggi */}
      <AlertModal
        show={showAlertModal}
        onHide={() => setShowAlertModal(false)}
        title={alertTitle}
        message={alertMessage}
      />
    </div>
  );
};

export default AdminMenu; 