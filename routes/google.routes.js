import express from 'express';
import passport from '../auth/google.strategy.js';
import jwt from 'jsonwebtoken';
import { JWTSIGNUP } from '../config.js';

const router = express.Router();
const JWT_SECRET = JWTSIGNUP;

// Iniciar login con Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  (req, res, next) => {
    console.log('🔁 Recibido callback desde Google, ejecutando autenticación...');
    next();
  },
  passport.authenticate('google', { session: false }),
  (req, res) => {
    console.log('✅ Usuario autenticado con Google:');
    console.log(req.user); // log del perfil recibido de Google

    const token = jwt.sign(req.user, JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log('🍪 Cookie token seteada. Redirigiendo al frontend...');
    res.redirect('http://localhost:3000'); // o tu ruta final
  }
);


// Obtener usuario autenticado
router.get('/user', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json(decoded);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ success: true });
});

export default router;
