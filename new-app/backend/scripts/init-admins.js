/**
 * Script per inizializzare gli admin nel database
 * 
 * Questo script crea admin predefiniti nel database se non esistono già
 */

const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Carica variabili d'ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Inizializzazione database
const sequelize = new Sequelize(
  process.env.DB_NAME || 'cinfolunch',
  process.env.DB_USER || 'cinfoeat',
  process.env.DB_PASSWORD || 'cinfoeat',
  {
    host: process.env.DB_HOST || 'db',
    dialect: 'mysql',
    logging: false,
  }
);

// Definizione modello Admin
const { DataTypes } = require('sequelize');
const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  display_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'admins',
  timestamps: false,
});

// Funzione per creare admin se non esistono
const createAdminsIfNotExist = async () => {
  try {
    // Connetti al database
    await sequelize.authenticate();
    console.log('Connessione al database stabilita con successo.');

    // Sincronizza il modello Admin
    await Admin.sync({ alter: false });
    console.log('Modello Admin sincronizzato con il database.');

    // Lista degli admin predefiniti
    const defaultAdmins = [
      { username: 'admin', display_name: 'Amministratore' },
      { username: '312518', display_name: 'Giulio Librando' },
      { username: 'test', display_name: 'Test User' },
    ];

    // Crea ogni admin se non esiste già
    for (const adminData of defaultAdmins) {
      const [admin, created] = await Admin.findOrCreate({
        where: { username: adminData.username },
        defaults: adminData
      });

      if (created) {
        console.log(`Admin creato: ${admin.username} (${admin.display_name})`);
      } else {
        console.log(`Admin già esistente: ${admin.username} (${admin.display_name})`);
      }
    }

    console.log('Inizializzazione admin completata.');
  } catch (error) {
    console.error('Errore durante l\'inizializzazione degli admin:', error);
  } finally {
    // Chiudi la connessione
    await sequelize.close();
  }
};

// Esegui l'inizializzazione
createAdminsIfNotExist(); 