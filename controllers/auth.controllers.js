
import bcryptjs from 'bcryptjs';
import { Op } from 'sequelize';
import moment from 'moment';
import { logger } from '../logger.js';

import { checkLoginLock }  from "../helpers/checkLoginLock.js";
import { generateToken }  from "../helpers/tokenManager.js";
// import { generateRandomCode } from "../helpers/generateRandomCode.js";
// import { verifyEmail } from "../config/usersEmailVerification.js";
// import { activateAndPassword } from "../config/mail-password.js";
import { generatePassword } from "../helpers/generatePassword.js";

import { LoginAttempt, Users } from '../models/index.js'



const login = async (req, res = response) => {

    const MAX_LOGIN_ATTEMPTS = 3;
    const LOCK_TIME = 15 * 60 * 1000;
  
    const { email, password } = req.body;

    try {

      const users = await Users.findOne({where:{email}});

      if (!users) {
        await LoginAttempt.create({ email });
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas',
        });
      }

      if (users.role === null || users.role === '') {
        return res.status(400).json({
          success: false,
          message: 'Usuario sin rol asignado. Contacte administrador',
        });
      }

      const passwordMatch = bcryptjs.compareSync(password, users.password);

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

      const checkPassword = bcryptjs.compareSync(password.trim(), users.password);

      
      if (!checkPassword) {
        await LoginAttempt.create({email});
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas',
          remainingAttempts,
        })
      }

      await LoginAttempt.destroy({where:{email}})

      //si es el primer login deja pasar sin doble auth

      const token = await generateToken(email);

      return res.status(200).json({
          success: true,
          token,
          users,
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

// de aca solo se crea la cuenta pero no se verifica, para publicar es necesario verificar la cuenta
const signUp = async (req, res) => {

  const { email, password, ...rest} = req.body;


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

const loginWithToken = async (req, res = response) => {

  // const { idpropulsao, role, Email } = req.usersAuth;

  // try {

  //     const token = await generateToken(Email);

  //     const [loginAs] = await pool.execute('SELECT * FROM users WHERE Email = ?', [Email]);

  //     return res.status(200).json({
  //       success: true,
  //       token,
  //       users: loginAs[0],
  //       firstlogin : "true"
  //     });

  // } catch (error) {
  //   console.log('Error desde loginWithToken:', error);

  //   let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';
 
  //   res.status(500).json({
  //     success: false,
  //     error: errorMessage,
  //   });
  // }
};

//una vez q el usuario ingresa al link que le mandamos, cambia su estado a "verified"
const validateEmail = async (req, res) => {
    
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
  //     idusers: usersToConfirm.idusers,
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

const resendPassword = async (req, res=response) => {

  // try {

  //     const { email }  = req.body;

  //     const [rows] = await pool.execute('SELECT * FROM users WHERE Email = ?', [email]);
  //     const users = rows[0];

  //     await checkUsersStates(email)


  //    if(users){
  //     if(users.validateEmail ==='UNVERIFIED'  ) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Usuário não verificado'
  //       })
  //     }
  //   }
  //   //  envia password de 12 digitos
  //    const genPassword = await generatePassword();

  //    const salt = bcryptjs.genSaltSync();
  //    const hashedPassword = bcryptjs.hashSync(genPassword, salt);
   
  //    const usersToUpdate = {
  //      password: hashedPassword,
  //      firstlogin : "0"
  //    };
   
     
  //     await activateAndPassword(users.Email, genPassword);


  //     const [result] = await pool.query('UPDATE users set ? WHERE Email = ?', [usersToUpdate, email]);
  
  //     if (result.affectedRows === 0) {
  //       return res.status(500).json({
  //         success: false,
  //         error: "Falha ao atualizar usuário.",
  //       });
  //     }

  //     const [updatedUsersResult] = await pool.query('SELECT * FROM users WHERE Email = ?', [email]);

  //     if (updatedUsersResult.length <= 0) {

  //       return res.status(500).json({
  //         success: false,
  //         error: 'Falha ao atualizar usuário..'
  //       });

  //     }else{

  //       const updatedUsers = updatedUsersResult[0];
      
  //       return res.status(200).json({
  //         success: true,
  //         users: updatedUsers
  //       });
  //     }

  // } catch (error) {

  //   let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';
  //   console.log("Error resendPassword: ", error);
  //   if (
  //     error.message.includes('O e-mail já está verificado') ||
  //     error.message.includes('Usuário não encontrado') ||
  //     error.message.includes('Usuário excluído') 
  //   ) {
  //     errorMessage = error.message;
  //   }

    
    
  //   return res.status(500).json({
  //       success: false,
  //       error: errorMessage
  //   });
    
  // }
}

// esto esta por si alguien no recibio el email para verificar y necesita q se le reenvie, recordar q no se puede verificar manualmente
const resendVerifyEmail = async (req, res) => {

//   try {
//   const { email } = req.body;

//   const [rows] = await pool.execute('SELECT * FROM users WHERE Email = ?', [email]);
//   const users = rows[0];


//   if (email !== '' && email !== null) {
    
//     await checkUsersStates(email);
    
//   // es para verificar el email (12)
//   const generateCode = await generateRandomCode();

//   await verifyEmail(email, generateCode);

//   const usersToUpdate = {
//     code: generateCode, 
//   };

//          // Actualizar el usuario
//     const [result] = await pool.query('UPDATE users set ? WHERE Email = ?', [usersToUpdate, email]);

//     if (result.affectedRows === 0) {
//       return res.status(500).json({
//         success: false,
//         error: "Falha ao atualizar usuário.",
//       });
//     }
  

//   return res.status(200).json({
//     success: true,
//   });
// }

//   } catch (error) {
//     console.log('verifyEmail Error: ', error);
//     let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

//     if (
//       error.message.includes('O e-mail já está verificado') ||
//       error.message.includes('Usuário não encontrado') ||
//       error.message.includes('Usuário excluído') 
//     ) {
//       errorMessage = error.message;
//     }
//     return res.status(500).json({
//     success: false,
//     error: errorMessage
//     });
//   }
};

const setUsersLogs = async (req, res) => {

//  try {

//     const { email } = req.body;

//      console.log('Email: ', email);

//     const [rows] = await pool.execute('SELECT * FROM users WHERE Email = ?', [email]);
//     let users = rows[0];

//     if(rows.length === 0){
//       return res.status(400).json({
//         success: false,
//         message: "Usuário não encontrado"
//       })
//     }

//     const ips = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//     const firstIp = ips.split(',')[0].trim();
//     const response = await axios.get(`https://ipinfo.io/${firstIp}/json`);
//     const data = response.data;

//     const log = {
//       date: new Date(),
//       idusers: users.idusers,
//       city: data.city,
//       country: data.country,
//       region: data.region,
//       ip: data.ip
//     }

//     const [result] = await pool.query('INSERT INTO users_log SET ?', [log]);

    
//     res.status(200).json({
//        success: true
//        });


//   } catch (error) {
//     console.log('setUsersLogs Error:', error);
//     let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

//     res.status(500).json({
//       error: errorMessage,
//     });
//   }
};




 



  export { 
            login,
            loginWithToken,
            signUp,
            validateEmail,
            resendPassword,
            resendVerifyEmail,
            setUsersLogs,
  }

