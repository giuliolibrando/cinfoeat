const { Sequelize } = require('sequelize');

// Default configuration
const dbConfig = {
  name: process.env.DB_NAME || 'cinfoeat',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost'
};

console.log('Attempting to connect to database with config:', {
  ...dbConfig,
  password: dbConfig.password ? '****' : 'no password'
});

const sequelize = new Sequelize(
  dbConfig.name,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: 'mysql',
    logging: (msg) => console.log('[Database]', msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 60000
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Test the connection
async function testConnection() {
  try {
    console.log('[Database] Testing connection...');
    await sequelize.authenticate();
    console.log('[Database] Connection has been established successfully.');
    
    // Sync without force to preserve data
    console.log('[Database] Syncing models...');
    await sequelize.sync();
    console.log('[Database] Models synchronized successfully (tables preserved).');
    
    // Test query to verify table exists
    try {
      const result = await sequelize.query('SHOW TABLES LIKE "menu_options"');
      console.log('[Database] Menu options table exists:', result[0].length > 0);
    } catch (error) {
      console.error('[Database] Error checking menu_options table:', error);
    }
  } catch (error) {
    console.error('[Database] Unable to connect to the database:', error);
    throw error;
  }
}

// Export both the sequelize instance and the test function
module.exports = {
  sequelize,
  testConnection
}; 