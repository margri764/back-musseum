
import nodemailer from 'nodemailer';
import { EMAIL_TRANSPORTER, PASSWORD_TRANSPORTER } from '../config.js';
import dotenv from 'dotenv';
dotenv.config();


const mail = {
    user: EMAIL_TRANSPORTER,
    pass: PASSWORD_TRANSPORTER
}


let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        greetingTimeout : 1000 * (60), 
        port: 465,
        tls: {
            rejectUnauthorized: false
        },
        secure: true, 
        auth: {
            user: mail.user, 
            pass: mail.pass, 
        },
 });

const emailRecover = async ( email, password) =>{
   
    const contentHtml = `

    <div style="padding:30px"> 
        
      
 
        <h1 style="color: #0078d4; font-size: 24px; font-family: Arial, sans-serif; margin-top:60px"> Ativar conta, nova senha </h1>
      

        <span style="font-size: 16px; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif; margin-top:30px; display: block "> Email: ${email}  </span>

        <span style="display: block; margin-top: 20px; font-size: 16px; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;"> Enviamos a sua nova senha para acesso. </span>

        <span style="font-size: 16px; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif; margin-top:30px; display: block "> <b> ${password} </b> </span>
      
    </div>
  `;

    try {
        
        await transporter.sendMail({
            from: `Museo <${mail.user}>`,
            to: email,
            subject: "Recuperar contraseña ",
            text:"Recuperar contrasñea",
            html: contentHtml,
           
        });


    } catch (error) {

        throw new Error (error)
    }
}


export { emailRecover }