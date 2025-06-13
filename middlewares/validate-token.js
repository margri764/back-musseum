
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { JWTSIGNUP } from '../config.js';



export const validateToken = async ( req, res, next ) => {

    try {

        let token = req.headers?.authorization;

        if(!token){
            return res.status(401).json({
                message:'There is no token in the header. Please log in again with your credentials'
            })
        }

        token = token.split(" ")[1];

        const  { email }  = jwt.verify(token, JWTSIGNUP)

        const user = await User.findOne({where:{email}})


        if(!user ){
              return res.status(400).json({
                  success: false,
                  message:'Invalid Token'
              })
        }else{
            return res.status(200).json({
                success: true,
                user,
                message:'valid Token'
            })
        }
        
    } catch (error) {
        console.log('validateToken Error: ', error);
        return res.status(401).json({
            success: false,
            error,
        })

    }

}


