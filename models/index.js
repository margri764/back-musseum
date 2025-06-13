import { sequelize } from '../db/config.db.js';
import { Users } from './user.model.js';
import { LoginAttempt } from './login_attempt.model.js';





import './associations.model.js';


export {
          sequelize,
          Users,
          LoginAttempt
    
   
       }
