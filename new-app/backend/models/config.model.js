const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Config = sequelize.define('Config', {
  function: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  state: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  value: {
    type: DataTypes.STRING,
    defaultValue: ''
  }
});

module.exports = Config; 