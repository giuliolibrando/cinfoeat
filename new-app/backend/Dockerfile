FROM node:16-alpine

WORKDIR /app

# Copia i file di configurazione del progetto
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il resto del codice sorgente
COPY . .

# Espone la porta dell'applicazione
EXPOSE 3001

# Comando per avviare l'applicazione
CMD ["node", "server.js"] 