import jwt from 'jsonwebtoken';
import { JWTSIGNUP } from '../config.js';

export const generateToken = async ( email ) => {

    const expiresIn = 60 * 60 * 24  * 30;

    const payload = { email };


try {
    const token = jwt.sign( payload , JWTSIGNUP, { expiresIn })

    return token;
    
} catch (error) {

    console.log("ERROR generateToken: ",error);
}
        

}




