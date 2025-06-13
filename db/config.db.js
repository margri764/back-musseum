import Sequelize from 'sequelize';


export const sequelize = new Sequelize('musseumdb', 'root', '@bulMysql18', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
  timezone: '+00:00',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  retry: {
    match: [
      /Deadlock/i,
      /Lock wait timeout exceeded/i
    ],
    max: 3
  }
});

