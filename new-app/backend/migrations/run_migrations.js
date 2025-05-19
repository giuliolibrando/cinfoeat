const { Sequelize } = require('sequelize');
const config = require('../config/config');
const updateForeignKeyConstraints = require('./update_foreign_key_constraints');

// Create Sequelize instance
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    dialect: config.database.dialect,
    logging: console.log
  }
);

// Define queryInterface
const queryInterface = sequelize.getQueryInterface();

async function runMigrations() {
  try {
    console.log('Starting migrations...');
    
    // Run the foreign key constraint update migration
    await updateForeignKeyConstraints.up(queryInterface, Sequelize);
    
    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations(); 