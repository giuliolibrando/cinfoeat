const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MenuHistory = sequelize.define('MenuHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
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
  flag_isdefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
}, {
  tableName: 'menu_history',
  timestamps: true,
  underscored: true
});

module.exports = MenuHistory; 