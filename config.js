import dotenv from 'dotenv';

dotenv.config();


//jwt
export const JWTSIGNUP = process.env.JWTSIGNUP;

//ports
export const PORT = process.env.NODE_ENV === 'production' ? ( 8000 ) : ( 8080);