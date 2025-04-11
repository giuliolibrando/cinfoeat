const { DataTypes } = require('sequelize');
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const Configuration = sequelize.define('Configuration', {
  function: {
    type: DataTypes.STRING(255),
    primaryKey: true,
  },
  state: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
  },
}, {
  tableName: 'configurations',
  timestamps: false,
});

module.exports = Configuration; 