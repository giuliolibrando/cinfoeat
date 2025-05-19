const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserChoiceHistory = sequelize.define('UserChoiceHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  display_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  item: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  }
}, {
  tableName: 'user_choice_history',
  timestamps: true,
  underscored: true
});

module.exports = UserChoiceHistory; 