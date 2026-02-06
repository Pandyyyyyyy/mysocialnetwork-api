import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import { authenticateToken } from './controllers/auth.mjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import config from './config.mjs';
import routes from './controllers/routes.mjs';

const Server = class Server {
  constructor() {
    this.app = express();
    this.config = config[process.argv[2]] || config.development;
  }

  async dbConnect() {
    try {
      const host = this.config.mongodb;

      this.connect = await mongoose.createConnection(host, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      const close = () => {
        this.connect.close((error) => {
          if (error) {
            console.error('[ERROR] api dbConnect() close() -> mongodb error', error);
          } else {
            console.log('[CLOSE] api dbConnect() -> mongodb closed');
          }
        });
      };

      this.connect.on('error', (err) => {
        setTimeout(() => {
          console.log('[ERROR] api dbConnect() -> mongodb error');
          this.connect = this.dbConnect(host);
        }, 5000);

        console.error(`[ERROR] api dbConnect() -> ${err}`);
      });

      this.connect.on('disconnected', () => {
        setTimeout(() => {
          console.log('[DISCONNECTED] api dbConnect() -> mongodb disconnected');
          this.connect = this.dbConnect(host);
        }, 5000);
      });

      process.on('SIGINT', () => {
        close();
        console.log('[API END PROCESS] api dbConnect() -> close mongodb connection');
        process.exit(0);
      });
    } catch (err) {
      console.error(`[ERROR] api dbConnect() -> ${err}`);
    }
  }

  middleware() {
    this.app.use(compression());
    this.app.use(cors());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());
  }

  routes() {
    routes.authRegister(this.app, this.connect);
    new routes.Users(this.app, this.connect);
    new routes.Groups(this.app, this.connect);
    new routes.Events(this.app, this.connect);
    new routes.DiscussionThreads(this.app, this.connect);
    new routes.PhotoAlbums(this.app, this.connect);
    new routes.Polls(this.app, this.connect);
    new routes.Tickets(this.app, this.connect);
    new routes.ShoppingList(this.app, this.connect);
    new routes.Carpool(this.app, this.connect);

    this.app.get('/protected', authenticateToken, (req, res) => {
      res.json({ message: 'Accès autorisé', user: req.user });
    });

    this.app.get('/', (req, res) => {
      res.json({
        name: 'MySocialNetwork API',
        version: '1.0.0',
        endpoints: {
          auth: ['POST /auth/register', 'POST /auth/login'],
          users: ['GET /users', 'GET /users/:id', 'POST /users', 'PUT /users/:id', 'DELETE /users/:id'],
          groups: ['GET /groups', 'GET /groups/:id', 'POST /groups', 'PUT /groups/:id', 'POST /groups/:id/members', 'GET /groups/:id/events'],
          events: ['GET /events', 'GET /events/:id', 'POST /events', 'PUT /events/:id', 'POST /events/:id/participants'],
          discussionThreads: ['GET /discussion-threads', 'GET /discussion-threads/:id', 'POST /discussion-threads', 'POST /discussion-threads/:threadId/messages', 'POST /discussion-threads/:threadId/messages/:parentId/replies'],
          photoAlbums: ['GET /photo-albums/:id', 'POST /photo-albums', 'GET /events/:eventId/photo-albums', 'POST /photo-albums/:albumId/photos', 'POST /photos/:photoId/comments'],
          polls: ['GET /polls/:id', 'GET /events/:eventId/polls', 'POST /polls', 'POST /polls/:id/vote'],
          tickets: ['GET /events/:eventId/ticket-types', 'POST /events/:eventId/ticket-types', 'POST /tickets/purchase', 'GET /events/:eventId/tickets'],
          shoppingList: ['GET /events/:eventId/shopping-items', 'POST /events/:eventId/shopping-items', 'DELETE /events/:eventId/shopping-items/:itemId'],
          carpool: ['GET /events/:eventId/carpools', 'POST /events/:eventId/carpools', 'POST /carpools/:id/join']
        }
      });
    });

    this.app.use((req, res) => {
      res.status(404).json({
        code: 404,
        message: 'Not Found'
      });
    });
  }

  security() {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100
    });
    this.app.use(helmet());
    this.app.use(limiter);
    this.app.disable('x-powered-by');
  }

  async run() {
    try {
      await this.dbConnect();
      this.security();
      this.middleware();
      this.routes();
      this.app.listen(this.config.port);
    } catch (err) {
      console.error(`[ERROR] Server -> ${err}`);
    }
  }
};

export default Server;
