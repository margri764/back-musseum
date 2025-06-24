import { DataTypes } from 'sequelize';
import { sequelize } from '../db/config.db.js';
import { Documents } from './documents.model.js';

const HistoryFamily = sequelize.define('HistoryFamily', {
    
  idhistory_family: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },

  story: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  iduser: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  iddocument: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Documents,
      key: 'iddocument',
    },
  },

  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },

  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  tableName: 'history_family',
  timestamps: true,
});

export { HistoryFamily };
