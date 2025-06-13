import { Router } from 'express';
import {check} from 'express-validator';

const router =  Router();

import { login, resendPassword, resendVerifyEmail, signUp, validateEmail } from '../controllers/auth.controllers.js'



router.post('/login',[
], login);  

// router.get('/loginWithToken',[
//   requireToken
// ], loginWithToken);  


router.post('/signUp',[
  // validateUserSignUpMiddleware
], signUp);  


//es x si alquien intenta hacer alguna accion sin tener la cuenta verificada se le reenvia el link de auth
router.post('/verifyEmail',[
], resendVerifyEmail);  


router.post('/validateEmail',[
], validateEmail); 

router.post('/resendPassword',[
], resendPassword); 


// router.post('/activeAccount',[
//   requireToken,
//   query('active').trim().escape().notEmpty().withMessage('query "active" is required')
//   .custom((value) => {
//       if (!allowedActive.includes(value)) {
//       throw new Error('Invalid "active" value');
//       }
//       return true;
//   }),
//   adminRole,
//   checkFields  

// ], activeAccount); 



export default router;
