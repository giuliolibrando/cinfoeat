const { DataTypes } = require('sequelize');
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const MenuOption = sequelize.define('MenuOption', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  item: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  flag_isdefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_DATE'),
  }
}, {
  tableName: 'menu_options',
  timestamps: false,
});

module.exports = MenuOption; 