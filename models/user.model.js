import { DataTypes } from 'sequelize';
import { sequelize } from '../db/config.db.js'; 

export const Users = sequelize.define('Users', {
  
  iduser: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING(150),
  },

  lastName: {
    type: DataTypes.STRING(150),
  },

  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  
  password: {
    type: DataTypes.STRING(150),
  },

  validateEmail: {
    type: DataTypes.STRING(150),
  },

  role: {
    type: DataTypes.STRING(20),
    allowNull: true, // Ajusta según sea necesario
  }

}, {
  tableName: 'users',
  timestamps: false // desactiva createdAt y updatedAt automáticos de Sequelize
});
