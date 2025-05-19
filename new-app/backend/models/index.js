const { sequelize } = require('../config/database');

// Import models
const MenuOption = require('./menuOption.model');
const UserChoice = require('./userChoice.model');
const Configuration = require('./configuration.model');
const Admin = require('./admin.model');
const PushSubscription = require('./pushSubscription.model');
const Payment = require('./payment.model');
const UserChoiceHistory = require('./userChoiceHistory.model');
const MenuHistory = require('./menuHistory.model');

// Define associations
UserChoice.belongsTo(MenuOption, {
  foreignKey: 'option_id',
  as: 'menuOption',
  onDelete: 'CASCADE'
});

MenuOption.hasMany(UserChoice, {
  foreignKey: 'option_id',
  as: 'choices',
  onDelete: 'CASCADE'
});

// Initialize models
const models = {
  MenuOption,
  UserChoice,
  Configuration,
  Admin,
  PushSubscription,
  Payment,
  UserChoiceHistory,
  MenuHistory,
  sequelize
};

// Export models
module.exports = models; 