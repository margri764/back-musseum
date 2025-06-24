import dotenv from 'dotenv';
dotenv.config();


//jwt
export const JWTSIGNUP = process.env.JWTSIGNUP;

//ports
export const PORT = process.env.NODE_ENV === 'production' ? ( 8000 ) : ( 8080);

//nodemailer
export const EMAIL_TRANSPORTER = process.env.EMAIL_TRANSPORTER
export const PASSWORD_TRANSPORTER = process.env.PASSWORD_TRANSPORTER 

//google
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

