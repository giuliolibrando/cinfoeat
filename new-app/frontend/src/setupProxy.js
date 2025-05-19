// Questo file viene riconosciuto automaticamente da react-scripts e consente di personalizzare la configurazione del server di sviluppo
// Lo utilizziamo per disabilitare il WebSocket che sta causando errori

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Disabilita completamente i websocket - commentato per permettere il funzionamento dei WebSocket
  /*
  process.env.WDS_SOCKET_HOST = 'none';
  process.env.WDS_SOCKET_PATH = 'none';
  process.env.WDS_SOCKET_PORT = '0';
  
  console.log('WebSocket disabilitato tramite setupProxy.js');
  */
  console.log('WebSocket abilitato in setupProxy.js');

  // Ottieni l'URL del backend dall'ambiente
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
  console.log('Proxy target configurato a:', backendUrl);

  app.use(
    '/api',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '/api'
      },
      onProxyRes: function(proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      }
    })
  );
}; 