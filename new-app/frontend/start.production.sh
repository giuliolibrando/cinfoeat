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


# Crea il file di configurazione con le variabili d'ambiente
cat > /usr/share/nginx/html/config.js << EOF
window.ENV = {
  REACT_APP_API_URL: "${REACT_APP_API_URL}",
  REACT_APP_BACKEND_URL: "${REACT_APP_BACKEND_URL}"
};
EOF

echo "Contenuto del file config.js:"
cat /usr/share/nginx/html/config.js

# Inserisci il riferimento al file di configurazione nell'index.html
sed -i 's/<head>/<head>\n  <script src="\/config.js"><\/script>/' /usr/share/nginx/html/index.html
# Verifica che la configurazione di nginx sia valida
nginx -t

# Avvia nginx in foreground
exec nginx -g 'daemon off;' 