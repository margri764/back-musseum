import { Router } from 'express';
import {check} from 'express-validator';

const router =  Router();

import { login, logout, me, refreshToken, signUp, validateEmail } from '../controllers/auth.controllers.js'
import { requireToken } from '../middlewares/requireToken.js';



router.post('/login',[
], login);  

router.post('/logout',[
], logout);  


router.post('/signUp',[
  // validateUserSignUpMiddleware
], signUp);  

router.get('/me',[
], me);  




//es x si alquien intenta hacer alguna accion sin tener la cuenta verificada se le reenvia el link de auth
// router.post('/verifyEmail',[
//   requireToken
// ], verifyEmail);  

router.post('/refreshToken',[
], refreshToken);  


router.post('/validateEmail',[
  requireToken
], validateEmail); 


export default router;