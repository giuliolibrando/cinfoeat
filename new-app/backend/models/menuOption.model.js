const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'menu_options',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['item', 'date']
    }
  ],
  hooks: {
    beforeSave: async (instance) => {
      console.log('[MenuOption] Before Save:', instance.toJSON());
      const now = new Date();
      if (!instance.created_at) {
        instance.created_at = now;
      }
      instance.updated_at = now;
    }
  }
});

// Don't auto-sync here, we'll handle it in the main application
module.exports = MenuOption; 