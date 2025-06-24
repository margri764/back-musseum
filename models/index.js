import { sequelize } from '../db/config.db.js';
import { Users } from './user.model.js';
import { LoginAttempt } from './login_attempt.model.js';
import { HistoryFamily } from './history_family.model.js';
import { Documents } from './documents.model.js';





import './associations.model.js';


export {
          sequelize,
          Users,
          LoginAttempt,
          Documents,
          HistoryFamily
    
   
       }
