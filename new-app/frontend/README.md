# CinfoEat Frontend

Questo è il frontend dell'applicazione CinfoEat, un'app per la prenotazione del pranzo. È sviluppato con React e comunica con il backend Node.js tramite API RESTful.

## Funzionalità

- Autenticazione tramite LDAP
- Visualizzazione delle opzioni del menu
- Aggiunta di elementi al proprio ordine
- Visualizzazione e gestione del proprio ordine
- Interfaccia di amministrazione (per utenti autorizzati)
- Notifiche push per aggiornamenti importanti

## Installazione

1. Clona il repository
2. Installa le dipendenze: `npm install`
3. Configura il file `.env` con le variabili necessarie
4. Avvia l'applicazione: `npm start`

## Comandi disponibili

- `npm start`: Avvia l'applicazione in modalità sviluppo
- `npm run build`: Compila l'applicazione per la produzione
- `npm test`: Esegue i test
- `npm run eject`: Estrae la configurazione di Create React App (non reversibile)

## Struttura del progetto

- `/src/components`: Componenti React riutilizzabili
- `/src/pages`: Pagine dell'applicazione
- `/src/services`: Servizi per le chiamate API e altre funzionalità
- `/src/context`: Context API per la gestione dello stato globale
- `/src/utils`: Funzioni di utilità
- `/public`: File statici 