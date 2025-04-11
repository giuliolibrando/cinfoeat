# CinfoEat - Applicazione per la Prenotazione del Pranzo

Questa è una versione moderna dell'applicazione CinfoEat per la prenotazione del pranzo, convertita da PHP a una architettura React/Node.js.

## Struttura del Progetto

Il progetto è diviso in due parti principali:

- `/backend`: Un'API RESTful basata su Node.js e Express che gestisce l'autenticazione, le opzioni del menu, le scelte degli utenti e le notifiche.
- `/frontend`: Un'applicazione React moderna e responsive che consuma l'API e fornisce un'interfaccia utente intuitiva.

## Caratteristiche

- Autenticazione tramite LDAP e JWT
- Gestione delle opzioni del menu
- Prenotazione dei pasti
- Pannello di amministrazione per gestire ordini, menu e amministratori
- Notifiche push per eventi importanti (apertura/chiusura ordini, arrivo del pranzo)
- Funzionalità PWA per un'esperienza simile a un'app nativa su dispositivi mobili

## Requisiti

- Node.js 14+
- MariaDB/MySQL
- Server LDAP per l'autenticazione

## Installazione

### Backend

1. Naviga nella directory `/backend`
2. Installa le dipendenze:
   ```
   npm install
   ```
3. Copia `.env.example` in `.env` e configura le variabili d'ambiente
4. Avvia il server:
   ```
   npm start
   ```

### Frontend

1. Naviga nella directory `/frontend`
2. Installa le dipendenze:
   ```
   npm install
   ```
3. Avvia l'applicazione in modalità sviluppo:
   ```
   npm start
   ```
4. Per la build di produzione:
   ```
   npm run build
   ```

## Database

Lo schema del database è compatibile con la versione precedente dell'applicazione. Utilizza le seguenti tabelle:

- `menu_options`: Opzioni del menu disponibili
- `user_choices`: Scelte degli utenti
- `configurations`: Impostazioni dell'applicazione (es. stato degli ordini)
- `admins`: Amministratori dell'applicazione
- `push_subscriptions`: Sottoscrizioni alle notifiche push

## Migrazione da PHP

Questa applicazione è una conversione completa dell'originale applicazione PHP, mantenendo le stesse funzionalità ma con una tecnologia più moderna e migliori pratiche di sviluppo. I miglioramenti includono:

- Miglior separazione tra frontend e backend
- Autenticazione JWT per maggiore sicurezza
- Interfaccia utente reattiva e moderna con React
- Supporto per PWA e notifiche push 