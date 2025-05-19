const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
  }
}, {
  tableName: 'configurations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Configuration; 