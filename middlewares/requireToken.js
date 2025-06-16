import jwt from 'jsonwebtoken';
import { Users } from '../models/user.model.js';
import { JWTSIGNUP } from '../config.js';

export const requireToken = async (req, res, next) => {
  try {
    const token = req.cookies?.token_musseum; // 👈 leemos la cookie
    

    console.log("token", token);
    

    if (!token) {
      return res.status(401).json({
        message: 'No token found in cookies. Please log in again.',
      });
    }


    const { email } = jwt.verify(token, JWTSIGNUP);

    const userAuth = await Users.findOne({ where: { email } });

    if (!userAuth) {
      return res.status(400).json({
        message: 'Invalid token',
      });
    }

    req.userAuth = userAuth;
    
    next();

  } catch (error) {
    console.log('requireToken Error:', error);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }
};
