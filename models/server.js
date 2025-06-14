import express from 'express';
import cors from 'cors';
import path from "path";
import morgan from "morgan";
import http from 'http';
import fileUpload from 'express-fileupload';
import requestIp from 'request-ip';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';



dotenv.config();

//routes
import authRoutes from '../routes/auth.routes.js';
// import userRoutes from '../routes/user.routes.js';



import { PORT } from '../config.js';
import { log } from 'console';


class Server{

        constructor(){
            this.app = express();
            this.app.use(cookieParser());
            this.port = PORT;
            this.server = http.createServer(this.app); // Crear servidor HTTP
            this.initialize();

        }

        async initialize() {
            try {
                this.middlewares();
                this.routes();
            } catch (error) {
                console.error('Error initializing server del cron job:', error);
            }
        }

 
        middlewares(){

            let corsOptions = null;

        if (process.env.NODE_ENV === 'development') {
        corsOptions = {
            origin: 'http://localhost:3000',
            credentials: true, // 👈 necesario para cookies
        };
        } else if (process.env.NODE_ENV === 'production') {
        corsOptions = {
            origin: ['https://tudominio.com'], // o el dominio real
            credentials: true,
        };
        }

            
            this.app.use(cors(corsOptions));
            

            this.app.use (express.json());
            this.app.use(morgan('dev'));
            this.app.use(requestIp.mw());
            this.app.use(fileUpload({
                useTempFiles : true,
                tempFileDir : '/tmp/',
                createParentPath: true
            }));
            this.app.use(express.static('public'));

            
            // Solo servir archivos estáticos en desarrollo
            if (process.env.NODE_ENV === 'development') {
                const __dirname = path.resolve(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
                const rootDir = path.resolve(__dirname, '../../');
                this.app.use('/documents', express.static(path.join(rootDir, 'documents')));
                this.app.use('/profilePicture', express.static(path.join(rootDir, 'profilePicture')));
        
            }
        

        }    

        routes(){
            const __dirname = path.resolve(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
            
            this.app.use('/api/auth', authRoutes);
            // // this.app.use('/api/user', userRoutes);
      
        

            // this.app.get('*', (req, res) => { 

            //     const indexPath = path.resolve(__dirname, '../../public/index.html');
            //     res.sendFile( indexPath )
            //     });
                
        }

        listen() {
            // Establecer el timeout
            this.server.setTimeout(0); 
    
            // Iniciar el servidor
            this.server.listen(this.port, () => {
                console.log(`Servidor corriendo en puerto ${this.port} (${process.env.NODE_ENV})`);
            });
        }



}

export default Server ;