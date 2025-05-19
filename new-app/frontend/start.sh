#!/bin/sh

# Verifica che la directory dei file statici esista
if [ ! -d "/usr/share/nginx/html" ]; then
    echo "Error: /usr/share/nginx/html directory not found"
    exit 1
fi

# Verifica che index.html esista
if [ ! -f "/usr/share/nginx/html/index.html" ]; then
    echo "Error: index.html not found in /usr/share/nginx/html"
    exit 1
fi

# Ottieni l'host del backend dal servizio Kubernetes
BACKEND_HOST="${CINFOEAT_BACKEND_V2_SERVICE_HOST}"
BACKEND_PORT="${CINFOEAT_BACKEND_V2_SERVICE_PORT}"

echo "Variabili d'ambiente:"
echo "CINFOEAT_BACKEND_V2_SERVICE_HOST: ${CINFOEAT_BACKEND_V2_SERVICE_HOST:-non impostato}"
echo "CINFOEAT_BACKEND_V2_SERVICE_PORT: ${CINFOEAT_BACKEND_V2_SERVICE_PORT:-non impostato}"

# Crea il file di configurazione con le variabili d'ambiente
cat > /usr/share/nginx/html/config.js << EOF
window.ENV = {
  REACT_APP_API_URL: "http://${BACKEND_HOST}:${BACKEND_PORT}",
  REACT_APP_BACKEND_URL: "http://${BACKEND_HOST}:${BACKEND_PORT}"
};
EOF

echo "Configurazione backend: ${BACKEND_HOST}:${BACKEND_PORT}"
echo "Contenuto del file config.js:"
cat /usr/share/nginx/html/config.js

# Inserisci il riferimento al file di configurazione nell'index.html
sed -i 's/<head>/<head>\n  <script src="\/config.js"><\/script>/' /usr/share/nginx/html/index.html

# Genera la configurazione di Nginx dinamicamente
cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;
    gzip_disable "MSIE [1-6]\.";

    # Timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 15;
    send_timeout 10;

    # Buffer size
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 8m;
    large_client_header_buffers 2 1k;

    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Cache static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' http: https: ws: wss:; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval';";

    # Error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

echo "Configurazione Nginx generata:"
cat /etc/nginx/conf.d/default.conf

# Verifica la configurazione di Nginx
nginx -t

# Avvia Nginx in foreground
exec nginx -g 'daemon off;' 