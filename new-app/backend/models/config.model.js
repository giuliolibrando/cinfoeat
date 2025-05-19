const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Config = sequelize.define('Config', {
  function: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    allowNull: false
  },
  state: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'configurations',
  timestamps: true,
  underscored: true
});

module.exports = Config; 