
import bcryptjs from 'bcryptjs';
import { Op } from 'sequelize';
import moment from 'moment';
import { logger } from '../logger.js';
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';

import { checkLoginLock }  from "../helpers/checkLoginLock.js";

import { LoginAttempt, Users } from '../models/index.js'
import { JWTSIGNUP } from '../config.js';
import { generateTokens } from '../helpers/generateToken.js';
import { generatePassword } from '../helpers/generatePassword.js';
import { emailRecover } from '../config/email-recovering.js';



const login = async (req, res = response) => {

    const MAX_LOGIN_ATTEMPTS = 3;
    const LOCK_TIME = 15 * 60 * 1000;
  
    const { email, password, remember } = req.body;


    try {

      const user = await Users.findOne({where:{email}});

      if (!user) {
        await LoginAttempt.create({ email });
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas',
        });
      }

      if (user.role === null || user.role === '') {
        return res.status(400).json({
          success: false,
          message: 'Usuario sin rol asignado. Contacte administrador',
        });
      }

      const passwordMatch = bcryptjs.compareSync(password.trim(), user.password);

      if (!passwordMatch) {
        await LoginAttempt.create({ email });
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas',
        });
      }

      const lockTime = new Date(Date.now() - LOCK_TIME);

      const loginRows = await LoginAttempt.findAll({
        where: {
          email,
          timestamp: {
            [Op.gte]: lockTime, // mayor o igual que lockTime
          }
        }
      });

     const remainingAttempts = MAX_LOGIN_ATTEMPTS - loginRows.length;
  
      if (loginRows.length >= MAX_LOGIN_ATTEMPTS) {

        const remainingLockTime = await checkLoginLock(email);

        if (remainingLockTime > 0) {
          const minutesRemaining = Math.ceil(remainingLockTime / (60 * 1000)); // Redondea hacia arriba
          return res.status(429).json({
            success: false,
            message: `Su cuenta se encuentra bloqueada. Por favor, aguarde ${minutesRemaining} minutos.`,
          });
        }
  
      }

      // si llego hasta aca es xq esta todo bien
      await LoginAttempt.destroy({where:{email}})



      const { accessToken, refreshToken } = await generateTokens(user);

      
      const accessCookie = serialize('token_musseum', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        ...(remember && { maxAge: 60 * 60 * 12 }) // solo si remember es true
        // maxAge: 60 * 60 * 12, // 12h
      });

        const cookies = [accessCookie];

      if (remember) {
        const refreshCookie = serialize('refresh_token_musseum', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 días
        });
        cookies.push(refreshCookie);
    }


    res.setHeader('Set-Cookie', cookies);

    return res.status(200).json({
      success: true,
      user
    });


    } catch (error) {
      console.log('Error desde Login:', error);

      const currentDate = moment().utc().format(); 
      logger.error(`login: ${currentDate}, users: ${email}, message: ${error.message}`);

      res.status(500).json({
        success: false,
        error: error.message,
      });

    }
};

const logout = (req, res) => {
  
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // elimina la cookie
  };

  const expiredAccessCookie = serialize('token_musseum', '', options);
  const expiredRefreshCookie = serialize('refresh_token_musseum', '', options);

  res.setHeader('Set-Cookie', [expiredAccessCookie, expiredRefreshCookie]);

  return res.status(200).json({
    success: true,
    message: 'Sesión cerrada correctamente',
  });
};

const googleCallback = async (req, res) => {

  try {
    const { id, name, email } = req.user;

    console.log('user', req.user);

    // Buscar o crear usuario
    let user = await Users.findOne({ where: { email } });

    if (!user) {
      user = await Users.create({
        // googleId: id,
        name,
        email,
        // cualquier otro campo que necesites
      });
    }

    const accessToken = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWTSIGNUP,
      { expiresIn: '12h' }
    );

    const accessCookie = serialize('token_musseum', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 12, // 12h
    });

      res.setHeader('Set-Cookie', accessCookie);

    console.log('✅ Usuario autenticado y guardado:', user.email);

    res.redirect('http://localhost:3000/recordar-usuario'); // o /dashboard
  } catch (error) {
    console.error('❌ Error en googleCallbackController:', error);
    res.redirect('http://localhost:3000/login?error=oauth');
  }
};

const rememberUserAuth = async (req, res) => {

  try {
    const { remember } = req.body;

    const token = req.cookies.token_musseum;

    if (!token) {
      return res.status(401).json({ message: 'No token found' });
    }

    const decoded = jwt.verify(token, JWTSIGNUP);

    const newToken = jwt.sign({ id: decoded.id, email: decoded.email }, JWTSIGNUP, {
      expiresIn: remember ? '12h' : undefined, // o '1d' si querés más largo
    });

    const refreshCookie = serialize('refresh_token_musseum', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });

    res.setHeader('Set-Cookie', refreshCookie);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error en rememberUserAuth:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// de aca solo se crea la cuenta pero no se verifica, para publicar es necesario verificar la cuenta
const signUp = async (req, res) => {

  const { email, password, ...rest } = req.body;

  try {


  if (email !== '' && email !== null) {
    const result = await Users.findOne({where:{email}});

    if (result) {
      return res.status(400).json({
        success: false,
        message: 'E-mail en uso. Por favor, seleccione uno diferente'
      });
    }
  }


  const salt = bcryptjs.genSaltSync();

  const hashedPassword = bcryptjs.hashSync(password, salt);
  
  const newUsers = {
    ...rest,
    email, 
    password: hashedPassword,
    role: "user",
    validateEmail: 'UNVERIFIED'
  }


  const user = await Users.create(newUsers)

  return res.status(200).json({
    success: true,
    user
  });

  } catch (error) {

      console.log('Error desde signUp:', error);

      const currentDate = moment().utc().format(); 
      logger.error(`login: ${currentDate}, users: ${name, email}, message: ${error.message}`);

      res.status(500).json({
        success: false,
        error: error.message,
      });

  }
};


const me = async (req, res) => {

  try {
    const accessToken = req.cookies?.token_musseum;
    const refreshToken = req.cookies?.refresh_token_musseum;

    let decoded;

    // 1. Si hay access token, intentá usarlo
    if (accessToken) {
      try {
        decoded = jwt.verify(accessToken, JWTSIGNUP);
      } catch (err) {
        // Si vencido o inválido, sigue al refresh
      }
    }

    // 2. Si no hay access o está vencido, probá con refresh
    if (!decoded && refreshToken) {

      try {
        const refreshDecoded = jwt.verify(refreshToken, JWTSIGNUP);

        const user = await Users.findOne({ where: { email: refreshDecoded.email } });
        if (!user) throw new Error('User not found');

        // Generar nuevo access token
        const newAccessToken = jwt.sign({
          iduser: user.iduser,
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        }, JWTSIGNUP, { expiresIn: '12h' });

        // Enviar nueva cookie
        res.setHeader('Set-Cookie', serialize('token_musseum', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 60 * 60 * 12, // 12h
        }));

        // Continuar con decoded actualizado
        decoded = jwt.verify(newAccessToken, JWTSIGNUP);
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Sesión expirada' });
      }
    }

    // 3. Si después de todo no hay decoded válido, error
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }

    const user = await Users.findOne({ where: { email: decoded.email } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    // 4. Retornar datos del usuario
    return res.status(200).json({
      success: true,
      user: {
        iduser: user.iduser,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }
    });

    } catch (error) {
      console.log('Error desde Me:', error);

      const currentDate = moment().utc().format(); 
      // logger.error(`Me: ${currentDate}, users: ${lastName}, message: ${error.message}`);

      res.status(500).json({
        success: false,
        error: error.message,
      });

    }
}


 const refreshToken = async (req, res) => {

  try {
    const token = req.cookies?.refresh_token_musseum;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const { email } = jwt.verify(token, JWTSIGNUP);

    // Si el token es válido, generamos uno nuevo
    const newAccessToken = jwt.sign({ email }, JWTSIGNUP, { expiresIn: '12h' });

    const accessCookie = serialize('token_musseum', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 12, // 12 horas
    });

    res.setHeader('Set-Cookie', accessCookie);
    return res.status(200).json({ success: true });

  } catch (error) {
   console.error('Error refreshToken:', error);

    const currentDate = moment().utc().format();
    logger.error(`refreshToken: ${currentDate}, message: ${error.message}`);

    return res.status(401).json({
      success: false,
      message: 'Refresh token inválido o expirado',
      error: error.message,
    });
  
  }
};

const resendPassword = async (req, res=response) => {

  try {

      const { email }  = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'El campo email es obligatorio.',
        });
      }


      const user = await Users.findOne({where:{email}});

      if(!user){

        return res.status(400).json({
          success: false,
          message: `El email: ${email} no existe en nuestra base de datos. Contacte al administrador.` 
        })

      }

    //  envia password de 6 digitos
     const genPassword = await generatePassword();

     const salt = bcryptjs.genSaltSync();
     const hashedPassword = bcryptjs.hashSync(genPassword, salt);
   
     
    await emailRecover(user.email, genPassword);
     
    await Users.update({password: hashedPassword}, { where: {iduser: user.iduser} });

  
  return res.status(200).json({
    success: true,
    message: "📬 Te enviamos un correo con tu nueva contraseña. Revisá tu bandeja de entrada y también la carpeta de spam."
  });


  } catch (error) {

    console.log("Error resendPassword: ", error);
    const currentDate = moment().utc().format(); 
    logger.error(`getAllCreditCards: ${currentDate}, message: ${error.message}`);

    res.status(500).json({
      success: false,
      error: error.message,
    });

  }
}


  export { 
            login,
            logout,
            googleCallback,
            me,
            signUp,
            refreshToken,
            resendPassword,
            rememberUserAuth
  }

