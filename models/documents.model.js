import { DataTypes } from 'sequelize';
import {sequelize} from '../db/config.db.js';
import { Users } from './user.model.js';


const Documents = sequelize.define('Documents', {

      iddocument: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      name: {
        type: DataTypes.STRING(150),
        allowNull: false
      },

      filePath: {
        type: DataTypes.STRING(500),
        allowNull: false
      },

      size: {
        type: DataTypes.STRING(45),
        allowNull: true
      },

      type: {
        type: DataTypes.STRING(100),
        allowNull: false
      },

      iduser: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: Users,
            key: 'iduser',
          },
        },

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },

    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        onUpdate: DataTypes.NOW,
        allowNull: false
    }

}, {
  tableName: 'documents', // Nombre de la tabla en la base de datos
  timestamps: true // Habilita los campos `createdAt` y `updatedAt`
});


export { Documents };
