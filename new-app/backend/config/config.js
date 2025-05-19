// Configurazione del server e delle variabili d'ambiente
module.exports = {
  // Chiave segreta per la firma dei token JWT
  secretKey: process.env.JWT_SECRET || 'cinfoeat-secret-key',
  
  // Tempo di scadenza del token (in secondi)
  tokenExpiration: process.env.TOKEN_EXPIRATION || 86400, // 24 ore
  
  // Configurazione del database
  database: {
    name: process.env.DB_NAME || 'cinfoeat',
    user: process.env.DB_USER || 'cinfoeat',
    password: process.env.DB_PASSWORD || 'cinfoeat',
    host: process.env.DB_HOST || 'db',
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  // Porta del server
  port: process.env.PORT || 3001,
  
  // Configurazione CORS
  corsOptions: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
  },
  
  // Impostazioni varie
  debug: process.env.DEBUG || false
}; 