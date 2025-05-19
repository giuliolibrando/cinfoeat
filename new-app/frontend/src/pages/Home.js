import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Spinner, Badge, Form, Modal, ListGroup, Container, Toast, ToastContainer } from 'react-bootstrap';
import { menuService, userChoiceService, adminService, publicService, paymentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
// Importiamo i componenti di FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import AlertModal from '../components/AlertModal';

const Home = () => {
  const { user } = useAuth();
  // Get configurations from ConfigContext
  const { 
    externalMenuConfig, 
    homeNotes, 
    paypalConfig, 
    orderState: configOrderState, 
    getExternalMenuUrl,
    loading: configLoading 
  } = useConfig();
  
  const [menuOptions, setMenuOptions] = useState([]);
  const [menuDate, setMenuDate] = useState('');
  const [userChoices, setUserChoices] = useState({ choices: [], total: 0 });
  const [orderState, setOrderState] = useState(configOrderState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [allUserChoices, setAllUserChoices] = useState([]);
  const [paymentInfo, setPaymentInfo] = useState({ paid: 0, remaining: 0 });
  const [showNewDishModal, setShowNewDishModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [amountToPay, setAmountToPay] = useState(0);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Funzione per aggiornare i dati del pagamento
  const updatePaymentInfo = async (total) => {
    try {
      const paymentResponse = await paymentService.getUserPayment();
      console.log('Payment response:', paymentResponse);
      
      if (!paymentResponse || !paymentResponse.data || !paymentResponse.data.data) {
        console.error('Invalid payment response structure:', paymentResponse);
        setPaymentInfo({
          total: total,
          paid: 0,
          remaining: total,
          partial_change_given: 0
        });
        return;
      }
      
      const paymentData = paymentResponse.data.data;
      console.log('Payment data:', paymentData);
      
      // Assicuriamoci che tutti i valori numerici siano numeri
      const amountPaid = parseFloat(paymentData.amount_paid || 0);
      const changeAmount = parseFloat(paymentData.change_amount || 0);
      const partialChangeGiven = parseFloat(paymentData.partial_change_given || 0);
      
      setPaymentInfo({
        total: total,
        paid: amountPaid,
        remaining: total - amountPaid,
        partial_change_given: partialChangeGiven
      });
      
      console.log('Payment info updated:', {
        total: total,
        paid: amountPaid,
        remaining: total - amountPaid,
        partial_change_given: partialChangeGiven
      });
    } catch (paymentError) {
      console.error('Error loading payment information:', paymentError);
      setPaymentInfo({
        total: total,
        paid: 0,
        remaining: total,
        partial_change_given: 0
      });
    }
  };

  // Effetto per l'aggiornamento periodico dei dati
  useEffect(() => {
    let intervalId;
    
    if (userChoices.total > 0) {
      // Aggiorna immediatamente
      updatePaymentInfo(userChoices.total);
      
      // Imposta l'aggiornamento ogni 2 secondi per rendere le modifiche più visibili
      intervalId = setInterval(() => {
        updatePaymentInfo(userChoices.total);
      }, 2000);
    }
    
    // Cleanup dell'intervallo quando il componente viene smontato
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [userChoices.total]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Carica le opzioni del menu
        const menuResponse = await menuService.getAll();
        console.log('Menu response:', menuResponse);
        setMenuOptions(menuResponse.data.data.options || []);
        // Formatta la data in italiano
        const today = new Date();
        const formattedDate = today.toLocaleDateString('it-IT', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        setMenuDate(formattedDate);
        console.log('Menu options retrieved:', menuResponse.data.data);

        // Carica le scelte dell'utente
        const userChoicesResponse = await userChoiceService.getUserChoices();
        setUserChoices(userChoicesResponse.data.data || { choices: [], total: 0 });
        console.log('User choices retrieved:', userChoicesResponse.data.data);
        
        // Carica il riepilogo di tutte le scelte utente (per mostrare cosa hanno ordinato gli altri)
        try {
          if (user?.isAdmin) {
            const summaryResponse = await userChoiceService.getSummary();
            setAllUserChoices(summaryResponse.data.data.users);
            console.log('All user choices retrieved:', summaryResponse.data.data.users);
          } else {
            // Per utenti non admin, facciamo una chiamata a un endpoint pubblico (da implementare sul backend)
            const publicSummaryResponse = await publicService.getAllUserChoices();
            setAllUserChoices(publicSummaryResponse.data.data);
            console.log('Public user choices retrieved:', publicSummaryResponse.data.data);
          }
        } catch (summaryError) {
          console.error('Error loading user choices summary:', summaryError);
          // Non blocchiamo l'app se questo fallisce
        }
        
        // Configurazione del menu esterno e note home già caricate dal ConfigContext
        
        // Controlla se gli ordini sono aperti
        await checkOrderState();

        // La configurazione PayPal è già caricata dal ConfigContext
        setPaypalEmail(paypalConfig.value || '');

        setLoading(false);
      } catch (err) {
        console.error('Errore durante il recupero dei dati:', err);
        setError('Si è verificato un errore durante il recupero dei dati. Riprova più tardi.');
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Funzione per controllare lo stato degli ordini
  const checkOrderState = async () => {
    // Usiamo lo stato degli ordini dal ConfigContext
    setOrderState(configOrderState);
  };

  // Effetto per il polling periodico dello stato degli ordini
  useEffect(() => {
    // Controlla lo stato degli ordini ogni 5 secondi
    const intervalId = setInterval(checkOrderState, 5000);

    // Cleanup dell'intervallo quando il componente viene smontato
    return () => {
      clearInterval(intervalId);
    };
  }, [user]);

  const handleAddChoice = (option) => {
    setSelectedOption(option);
    setQuantity(1);
    setShowAddModal(true);
  };

  const handleConfirmAdd = async () => {
    try {
      await userChoiceService.create({
        option_id: selectedOption.id,
        quantity: quantity
      });

      // Aggiorna la lista delle scelte utente
      const userChoicesResponse = await userChoiceService.getUserChoices();
      setUserChoices(userChoicesResponse.data.data);

      setShowAddModal(false);
    } catch (err) {
      console.error('Errore durante l\'aggiunta della scelta:', err);
      setError('Si è verificato un errore durante l\'aggiunta della scelta. Riprova più tardi.');
    }
  };

  const handleDeleteChoice = async (id) => {
    try {
      await userChoiceService.delete(id);

      // Aggiorna la lista delle scelte utente
      const userChoicesResponse = await userChoiceService.getUserChoices();
      setUserChoices(userChoicesResponse.data.data);
    } catch (err) {
      console.error('Errore durante l\'eliminazione della scelta:', err);
      setError('Si è verificato un errore durante l\'eliminazione della scelta. Riprova più tardi.');
    }
  };

  const handleUpdateQuantity = async (id, newQuantity) => {
    try {
      await userChoiceService.update(id, { quantity: newQuantity });

      // Aggiorna la lista delle scelte utente
      const userChoicesResponse = await userChoiceService.getUserChoices();
      setUserChoices(userChoicesResponse.data.data);
    } catch (err) {
      console.error('Errore durante l\'aggiornamento della quantità:', err);
      setError('Si è verificato un errore durante l\'aggiornamento della quantità. Riprova più tardi.');
    }
  };

  const handleCreateNewDish = async () => {
    try {
      if (!newDishName || !newDishPrice) {
        setError('Nome e prezzo sono obbligatori.');
        return;
      }

      // Chiamata all'API per creare un nuovo piatto
      await menuService.create({
        item: newDishName,
        price: parseFloat(newDishPrice),
        flag_isdefault: false,
      });

      // Aggiorna la lista delle opzioni del menu
      const menuResponse = await menuService.getAll();
      setMenuOptions(menuResponse.data.data.options || []);

      // Resetta il form
      setNewDishName('');
      setNewDishPrice('');
      setShowNewDishModal(false);

      // Mostra un messaggio di successo
      setError(null);
      setAlertTitle('Successo');
      setAlertMessage('Piatto creato con successo e disponibile per tutti gli utenti!');
      setShowAlertModal(true);
    } catch (err) {
      console.error('Errore durante la creazione del piatto:', err);
      setError('Si è verificato un errore durante la creazione del piatto. Riprova più tardi.');
      setAlertTitle('Errore');
      setAlertMessage('Si è verificato un errore durante la creazione del piatto. Riprova più tardi.');
      setShowAlertModal(true);
    }
  };

  const handlePaypalPayment = () => {
    if (!paypalEmail) {
      toast.error('Configurazione PayPal non valida');
      return;
    }

    const amountToPay = paymentInfo.remaining;
    const paypalUrl = `https://www.paypal.me/${encodeURIComponent(paypalEmail)}/${amountToPay.toFixed(2)}`;
    window.open(paypalUrl, '_blank');
  };

  const renderPaymentInfo = () => {
    if (!paymentInfo) return null;
    
    console.log('Rendering payment info:', paymentInfo);

    const total = parseFloat(paymentInfo.total || 0);
    const paid = parseFloat(paymentInfo.paid || 0);
    const remaining = total - paid;
    const partialChangeGiven = parseFloat(paymentInfo.partial_change_given || 0);
    const remainingChange = paid - total - partialChangeGiven;

    console.log('Calculated payment values:', { total, paid, remaining, partialChangeGiven, remainingChange });

    return (
      <Card className="mt-3">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Pagamento</h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-bold">Totale da pagare:</span>
            <span className="fs-5">€{total.toFixed(2)}</span>
          </div>
          
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-bold">Pagato:</span>
            <span className="fs-5 text-success">€{paid.toFixed(2)}</span>
          </div>

          {remaining > 0 && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold">Rimanente:</span>
                <span className="fs-5 text-danger">€{remaining.toFixed(2)}</span>
              </div>

              {partialChangeGiven > 0 && (
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold">Resto ricevuto:</span>
                  <span className="fs-5 text-info">€{partialChangeGiven.toFixed(2)}</span>
                </div>
              )}

              {remainingChange > 0 && (
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold">Resto da ricevere:</span>
                  <span className="fs-5 text-warning">€{remainingChange.toFixed(2)}</span>
                </div>
              )}

              {paypalConfig.state && paypalConfig.value && (
                <Button
                  variant="primary"
                  className="w-100 mt-3"
                  onClick={handlePaypalPayment}
                >
                  <i className="fab fa-paypal me-2"></i>
                  Paga con PayPal
                </Button>
              )}
            </>
          )}

          {remaining <= 0 && (
            <>
              <div className="alert alert-success mb-3">
                <FontAwesomeIcon icon={faCheckDouble} className="me-2" />
                Pagamento completato
              </div>
              {remainingChange > 0 && (
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">Resto da ricevere:</span>
                  <span className="fs-5 text-warning">€{remainingChange.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Caricamento in corso...</p>
      </div>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2>Ordine Pranzo</h2>
          <div className="d-flex align-items-center">
            <h4 className="mb-0 me-3">Stato ordini:</h4>
            <Badge bg={orderState ? 'success' : 'danger'} className="fs-5 px-4 py-2">
              {orderState ? 'Aperti' : 'Chiusi'}
            </Badge>
          </div>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      
      {!orderState && (
        <Alert variant="danger" className="mb-4">
          <h5 className="mb-2">Ordini Chiusi</h5>
          <p className="mb-0">Gli ordini sono attualmente chiusi. Non è possibile aggiungere o modificare il tuo ordine.</p>
        </Alert>
      )}

      {/* Sezione Note Home */}
      {homeNotes.state && homeNotes.value !== '' && (
        <Card className="mb-4 bg-info text-white">
          <Card.Body>
            <h5 className="mb-3">Note Importanti</h5>
            <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{homeNotes.value}</p>
          </Card.Body>
        </Card>
      )}

      {/* Sezione Menu Esterno */}
      {externalMenuConfig.state && (
        <Card className="mb-4 bg-light">
          <Card.Body className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">Menu Esterno Disponibile</h5>
              <p className="text-muted mb-0">Clicca sul pulsante per visualizzare il menu completo</p>
            </div>
            <a 
              href={getExternalMenuUrl(externalMenuConfig.value)}
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
            >
              <i className="fas fa-external-link-alt me-2"></i>
              Apri Menu Esterno
            </a>
          </Card.Body>
        </Card>
      )}

      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Menu Disponibile</h5>
                <small>{menuDate}</small>
              </div>
              <Button 
                variant="light" 
                size="sm" 
                onClick={() => setShowNewDishModal(true)}
                disabled={!orderState}
                title={!orderState ? "Gli ordini sono chiusi" : "Crea un nuovo piatto"}
              >
                <FontAwesomeIcon icon={faPlus} /> Crea Nuovo Piatto
              </Button>
            </Card.Header>
            <Card.Body>
              {!menuOptions || menuOptions.length === 0 ? (
                <Alert variant="info">Nessuna opzione menu disponibile.</Alert>
              ) : (
                <Row>
                  {menuOptions.map((option) => (
                    <Col md={6} key={option.id}>
                      <Card className="mb-3 card-menu">
                        <Card.Body>
                          <Card.Title>{option.item}</Card.Title>
                          <Card.Text>
                            Prezzo: €{parseFloat(option.price).toFixed(2)}
                            {option.flag_isdefault && (
                              <Badge bg="info" className="ms-2">
                                Default
                              </Badge>
                            )}
                          </Card.Text>
                          {orderState ? (
                            <Button
                              variant="primary"
                              onClick={() => handleAddChoice(option)}
                            >
                              Aggiungi
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              disabled
                              title="Gli ordini sono chiusi"
                            >
                              Aggiungi
                            </Button>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
          
          {/* Sezione degli ordini degli altri utenti */}
          <Card className="mb-4">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">Cosa Hanno Ordinato Gli Altri</h5>
            </Card.Header>
            <Card.Body>
              {allUserChoices.length === 0 ? (
                <Alert variant="info">Nessun altro utente ha effettuato ordini.</Alert>
              ) : (
                <ListGroup>
                  {allUserChoices.map((userChoice, index) => (
                    <ListGroup.Item key={index}>
                      <h6>{userChoice.display_name}</h6>
                      <ul className="mb-0">
                        {userChoice.choices && userChoice.choices.map((choice, idx) => (
                          <li key={idx}>
                            {choice.item} x {choice.quantity} = €{parseFloat(choice.total).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                      <div className="text-end mt-1">
                        <small className="text-muted">Totale: €{parseFloat(userChoice.total).toFixed(2)}</small>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Il tuo Ordine</h5>
            </Card.Header>
            <Card.Body>
              {!userChoices?.choices || userChoices.choices.length === 0 ? (
                <Alert variant="info">Non hai ancora aggiunto elementi al tuo ordine.</Alert>
              ) : (
                <>
                  {userChoices.choices.map((choice) => (
                    <Card className="mb-2" key={choice.id}>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6>{choice.menuOption?.item || 'Piatto non disponibile'}</h6>
                            <small>
                              €{parseFloat(choice.menuOption?.price || 0).toFixed(2)} x {choice.quantity} = 
                              €{parseFloat((choice.menuOption?.price || 0) * choice.quantity).toFixed(2)}
                            </small>
                          </div>
                          <div className="d-flex align-items-center">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleUpdateQuantity(choice.id, Math.max(1, choice.quantity - 1))}
                              disabled={!orderState}
                            >
                              -
                            </Button>
                            <span className="mx-2">{choice.quantity}</span>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleUpdateQuantity(choice.id, choice.quantity + 1)}
                              disabled={!orderState}
                              className="me-2"
                            >
                              +
                            </Button>
                            <Button
                              variant={orderState ? "danger" : "secondary"}
                              size="sm"
                              onClick={() => handleDeleteChoice(choice.id)}
                              disabled={!orderState}
                            >
                              X
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                  
                  <div className="mt-3 text-end">
                    <h6>Totale: €{parseFloat(userChoices.total).toFixed(2)}</h6>
                  </div>
                  
                  {renderPaymentInfo()}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal per aggiungere un elemento */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Aggiungi al tuo ordine</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOption && (
            <div>
              <h5>{selectedOption.item}</h5>
              <p>Prezzo: €{parseFloat(selectedOption.price).toFixed(2)}</p>
              <Form.Group className="mb-3">
                <Form.Label>Quantità</Form.Label>
                <div className="d-flex align-items-center">
                  <Button
                    variant="outline-secondary"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="mx-3">{quantity}</span>
                  <Button
                    variant="outline-secondary"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </Form.Group>
              <p className="mt-3">
                Totale: €{parseFloat(selectedOption.price * quantity).toFixed(2)}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleConfirmAdd}>
            Aggiungi
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal per creare un nuovo piatto */}
      <Modal show={showNewDishModal} onHide={() => setShowNewDishModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Crea Nuovo Piatto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formDishName">
              <Form.Label>Nome Piatto</Form.Label>
              <Form.Control
                type="text"
                placeholder="Inserisci il nome del piatto"
                value={newDishName}
                onChange={(e) => setNewDishName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formDishPrice">
              <Form.Label>Prezzo</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                placeholder="Inserisci il prezzo"
                value={newDishPrice}
                onChange={(e) => setNewDishPrice(e.target.value)}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewDishModal(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleCreateNewDish}>
            Crea Piatto
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal di alerta per messaggi */}
      <AlertModal
        show={showAlertModal}
        onHide={() => setShowAlertModal(false)}
        title={alertTitle}
        message={alertMessage}
      />
    </Container>
  );
};

export default Home; 