const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const MenuOption = require('./menuOption.model');

const UserChoice = sequelize.define('UserChoice', {
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
  },
  option_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: MenuOption,
      key: 'id',
      onDelete: 'CASCADE',
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'user_choices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = UserChoice; 