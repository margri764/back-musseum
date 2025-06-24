import { Router } from 'express';
import passport from '../auth/google.strategy.js';
import jwt from 'jsonwebtoken';

const router =  Router();

import { googleCallback, login, logout, me, refreshToken, rememberUserAuth, resendPassword, signUp } from '../controllers/auth.controllers.js'
import { requireToken } from '../middlewares/requireToken.js';
import { JWTSIGNUP } from '../config.js';

const JWT_SECRET = JWTSIGNUP;




router.post('/login',[
], login);  

router.post('/logout',[
], logout);  

router.post('/signUp',[
  // validateUserSignUpMiddleware
], signUp);  

router.get('/me',[
], me);  

router.post('/refreshToken',[
], refreshToken);  

router.post('/resendPassword',[
], resendPassword);  

router.post('/rememberUserAuth',[
  requireToken
], rememberUserAuth);  


// Iniciar login con Google

router.get('/google',
  (req, res, next) => {
    console.log('✅ Entró a /api/auth/google');
    next(); // sigue con passport
  },
  passport.authenticate('google', { scope: ['profile', 'email'] })
);


// Callback desde Google
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  googleCallback
);





export default router;