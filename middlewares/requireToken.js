import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { JWTSIGNUP } from '../config.js';

export const requireToken = async (req, res, next) => {
  try {
    let token = req.headers?.authorization;

    if (!token) {
      return res.status(401).json({
        message: 'There is no token in the header. Please log in again with your credentials'
      });
    }

    token = token.split(" ")[1];

    const { email } = jwt.verify(token, JWTSIGNUP);

    const userAuth = await User.findOne({ where: { email } });

    if (!userAuth) {
      return res.status(400).json({
        message: 'Invalid Token'
      });
    }

    req.userAuth = userAuth;
    next();

  } catch (error) {
    console.log('requireToken Error: ', error);
    return res.status(401).json({
      success: false,
      error,
    });
  }
};
