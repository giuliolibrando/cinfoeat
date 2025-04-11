# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze
RUN npm ci

# Copia il resto dei file
COPY . .

# Build dell'applicazione
RUN npm run build

# Production stage con Nginx
FROM nginx:alpine

# Copia la build da React
COPY --from=build /app/build /usr/share/nginx/html

# Copia la configurazione di Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Esponi la porta 80
EXPOSE 80

# Avvia Nginx
CMD ["nginx", "-g", "daemon off;"] 
