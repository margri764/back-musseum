// helpers/generateTokens.js
import jwt from 'jsonwebtoken';
import { JWTSIGNUP } from '../config.js';

export async function generateTokens(user)  {
  const payload = {
    iduser: user.iduser,
    name: user.name,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };


  const accessToken = jwt.sign(payload, JWTSIGNUP, { expiresIn: '12h' });
  const refreshToken = jwt.sign(payload, JWTSIGNUP, { expiresIn: '30d' });

  return { accessToken, refreshToken };
}
