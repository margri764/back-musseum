import express from 'express';
import http from 'http';
import cors from 'cors';
import path from "path";
import morgan from "morgan";
import requestIp from 'request-ip';
import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';

import passport from '../auth/google.strategy.js'; // <--- importante importar tu estrategia
import authRoutes from '../routes/auth.routes.js';
import familyHistories from '../routes/family-histories.routes.js';
import { PORT } from '../config.js';


class Server {

  constructor() {
    this.app = express();
    this.port = PORT;
    this.server = http.createServer(this.app);

    this.app.use(cookieParser());
    this.app.use(passport.initialize()); // GOOGLE

    this.initialize();
  }

  async initialize() {
    try {
      this.middlewares();
      this.routes();
    } catch (error) {
      console.error('Error initializing server:', error);
    }
  }

  middlewares() {
    let corsOptions = null;

    if (process.env.NODE_ENV === 'development') {
      corsOptions = {
        origin: 'http://localhost:3000',
        credentials: true,
      };
    } else {
      corsOptions = {
        origin: ['https://tudominio.com'],
        credentials: true,
      };
    }

    this.app.use(cors(corsOptions));
    this.app.use(express.json());
    this.app.use(morgan('dev'));
    this.app.use(requestIp.mw());
    this.app.use(fileUpload({
      useTempFiles: true,
      tempFileDir: '/tmp/',
      createParentPath: true,
    }));
    this.app.use(express.static('public'));

    if (process.env.NODE_ENV === 'development') {
      const __dirname = path.resolve(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
      const rootDir = path.resolve(__dirname, '../../');
      this.app.use('/documents', express.static(path.join(rootDir, 'documents')));
      this.app.use('/familyHistories', express.static(path.join(rootDir, 'familyHistories')));
    }
  }

  routes() {
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/family-histories', familyHistories); 
    }

  listen() {
    this.server.setTimeout(0);
    this.server.listen(this.port, () => {
      console.log(`Servidor corriendo en puerto ${this.port} (${process.env.NODE_ENV})`);
    });
  }
}

export default Server;
