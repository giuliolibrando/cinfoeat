import React, { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';
import AlertModal from './AlertModal';

const AdminView = () => {
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  
  // Stati per i modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [adminToDelete, setAdminToDelete] = useState(null);

  const fetchAdmins = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/admins`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      } else {
        setError('Errore nel caricamento degli amministratori');
        setAlertTitle('Errore');
        setAlertMessage('Errore nel caricamento degli amministratori');
        setShowAlertModal(true);
      }
    } catch (err) {
      setError('Errore di connessione');
      setAlertTitle('Errore');
      setAlertMessage('Errore di connessione');
      setShowAlertModal(true);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleDelete = async (id) => {
    setAdminToDelete(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/admins/${adminToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchAdmins();
        setAlertTitle('Successo');
        setAlertMessage('Amministratore eliminato con successo');
        setShowAlertModal(true);
      } else {
        setError('Errore durante l\'eliminazione dell\'amministratore');
        setAlertTitle('Errore');
        setAlertMessage('Errore durante l\'eliminazione dell\'amministratore');
        setShowAlertModal(true);
      }
    } catch (err) {
      setError('Errore di connessione');
      setAlertTitle('Errore');
      setAlertMessage('Errore di connessione');
      setShowAlertModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ username: newUsername })
      });

      if (response.ok) {
        setNewUsername('');
        fetchAdmins();
      } else {
        const error = await response.json();
        setError(error.message || 'Errore durante la creazione dell\'amministratore');
      }
    } catch (err) {
      setError('Errore di connessione');
    }
  };

  return (
    <div className="admin-view">
      <h2>Gestione Amministratori</h2>
      
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label htmlFor="username">Username *</label>
          <input
            type="text"
            id="username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
            placeholder="Inserisci l'username dell'amministratore"
          />
        </div>

        <button type="submit" className="btn btn-primary">Aggiungi Amministratore</button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="admins-list">
        <h3>Amministratori Attuali</h3>
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Nome</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.id}>
                <td>{admin.username}</td>
                <td>{admin.nome}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(admin.id)}
                    className="btn btn-danger"
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal di conferma per eliminare un admin */}
      <ConfirmModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Conferma eliminazione"
        message="Sei sicuro di voler eliminare questo amministratore?"
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

export default AdminView; 