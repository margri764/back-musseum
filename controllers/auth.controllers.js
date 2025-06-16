
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

//una vez q el usuario ingresa al link que le mandamos, cambia su estado a "verified"
const validateEmail = async (req, res) => {

        return res.status(200).json({
          success: true,
          message: 'El token es válido'
      });
    
  // try {
     
  //    const { email, code } = req.body;

  //    const [rows] = await pool.execute('SELECT * FROM users WHERE Email = ?', [email]);
  //    const usersToConfirm = rows[0];

  //   const check = await checkUsersStates(email);
    
  //   if(!check){
  //     return
  //   }

  //   // por si intenta verificar dos veces el mismo email
  //   if(usersToConfirm.validateEmail === 'VERIFIED'){
  //     return res.status(200).json({
  //       success: false,
  //       message: 'E-mail verificado',
  //     });

  //    }

  //   if (usersToConfirm.code !== code) {
  //     return res.status(401).json({
  //       success: false,
  //       message: 'Credenciais incorretas',
  //     });
  //   }
      
  //   usersToConfirm.validateEmail = 'VERIFIED';
  //   usersToConfirm.role = 'users';

  //        // Actualizar el usuario
  //   const [result] = await pool.query('UPDATE users set ? WHERE Email = ?', [usersToConfirm, email]);

  //   if (result.affectedRows === 0) {
  //     return res.status(500).json({
  //       success: false,
  //       error: "Falha ao atualizar usuário.",
  //     });
  //   }

  //   const insertPermissionRequest = {
  //     date: new Date(),
  //     iduser: usersToConfirm.iduser,
  //     state: "requested",
  //   }
    
  //  await pool.query('INSERT INTO registration_permission SET ?', [insertPermissionRequest]);

  // const [searchUsers] = await pool.query('SELECT * FROM users WHERE Email = ?', [email])

  // const users = searchUsers[0];

  //  //les mando msj a webmasters, admins y super admin q alguien se registro con exito 
  // let arrEmails = [];

  // const [emailDestination] = await pool.execute('SELECT * FROM users WHERE role IN (?, ?, ?)', ["webmaster", "admin", "super_admin"]);

  //   emailDestination.forEach((users)=>{ arrEmails.push(users.Email)})

  // // await sendAdminEmail(body, administrator.Email);

  // const body = {
  //     resgisterName : users.Nome_Completo,
  //     resgisterEmail: users.Email,
  //     date: new Date(),
  //     Nome_da_sede: users.Nome_da_sede,
  //     Pais_da_sede: users.Pais_da_sede, 
  //     Cidade_da_sede: users.Cidade_da_sede,
  // }

  // for (const administratorEmail of arrEmails) {
  //   await registrationAlert(body, administratorEmail);
  // }

  // return res.status(200).json({
  //     success: true,
  //     message: 'E-mail verificado com sucesso',
  //     users, 
  // });

     
  // } catch (error) {
  //     console.log("Error desde validateEmail ", error);

  //     let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';
      

  //     if (
  //       error.message.includes('O e-mail já está verificado') ||
  //       error.message.includes('Usuário não encontrado') ||
  //       error.message.includes('Usuário excluído') 
  //     ) {
  //       errorMessage = error.message;
  //     }

  //     return res.status(500).json({
  //         success: false,
  //         error: errorMessage
  //     });
  // }
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

  export { 
            login,
            logout,
            me,
            signUp,
            validateEmail,
            refreshToken
  }

