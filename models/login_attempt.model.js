

import { DataTypes } from 'sequelize';
import { sequelize } from '../db/config.db.js'; // o desde donde exportes tu instancia

export const LoginAttempt = sequelize.define('LoginAttempt', {
  idlogin_attempt: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Sequelize lo llena por defecto si no lo maneja SQL
  }
}, {
  tableName: 'login_attempts',
  timestamps: false // desactiva createdAt y updatedAt automáticos de Sequelize
});
