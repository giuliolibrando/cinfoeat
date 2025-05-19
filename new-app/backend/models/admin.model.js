const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  display_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  }
}, {
  tableName: 'admins',
  timestamps: true,
  underscored: true
});

module.exports = Admin; 