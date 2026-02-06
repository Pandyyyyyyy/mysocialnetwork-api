import bcrypt from 'bcryptjs';
import UserModel from '../models/user.mjs';
import { handleValidationErrors, userCreateValidator, userUpdateValidator } from '../validators/index.mjs';
import { authenticateToken } from './auth.mjs';

const Users = class Users {
  constructor(app, connect) {
    this.app = app;
    this.UserModel = connect.model('User', UserModel);
    this.run();
  }

  create() {
    this.app.post(
      '/users',
      userCreateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const existingUser = await this.UserModel.findOne({ email: req.body.email });
          if (existingUser) {
            return res.status(409).json({
              code: 409,
              message: 'Un utilisateur avec cet email existe déjà'
            });
          }
          const hashedPassword = req.body.password
            ? await bcrypt.hash(req.body.password, 10)
            : undefined;
          const userModel = new this.UserModel({
            ...req.body,
            ...(hashedPassword && { password: hashedPassword })
          });
          const user = await userModel.save();
          res.status(201).json(user);
        } catch (err) {
          console.error('[ERROR] users/create ->', err);
          res.status(500).json({
            code: 500,
            message: 'Internal Server error'
          });
        }
      }
    );
  }

  showById() {
    this.app.get('/users/:id', async (req, res) => {
      try {
        const user = await this.UserModel.findById(req.params.id);
        if (!user) {
          return res.status(404).json({ code: 404, message: 'Utilisateur non trouvé' });
        }
        res.status(200).json(user);
      } catch (err) {
        console.error('[ERROR] users/:id ->', err);
        res.status(500).json({
          code: 500,
          message: 'Internal Server error'
        });
      }
    });
  }

  deleteById() {
    this.app.delete('/users/:id', authenticateToken, async (req, res) => {
      try {
        const user = await this.UserModel.findByIdAndDelete(req.params.id);
        if (!user) {
          return res.status(404).json({ code: 404, message: 'Utilisateur non trouvé' });
        }
        res.status(200).json(user);
      } catch (err) {
        console.error('[ERROR] users/:id delete ->', err);
        res.status(500).json({
          code: 500,
          message: 'Internal Server error'
        });
      }
    });
  }

  findAll() {
    this.app.get('/users', async (req, res) => {
      try {
        const filters = req.query;
        const users = await this.UserModel.find(filters);
        res.status(200).json(users);
      } catch (err) {
        console.error('[ERROR] GET /users ->', err);
        res.status(500).json({
          code: 500,
          message: 'Internal Server Error'
        });
      }
    });
  }

  findByIdAndUpdate() {
    this.app.put(
      '/users/:id',
      authenticateToken,
      userUpdateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const { password, email, ...updateData } = req.body;
          const user = await this.UserModel.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
          );
          if (!user) {
            return res.status(404).json({ code: 404, message: 'Utilisateur non trouvé' });
          }
          res.status(200).json(user);
        } catch (err) {
          console.error('[ERROR] PUT /users/:id ->', err);
          res.status(400).json({
            code: 400,
            message: 'Bad request'
          });
        }
      }
    );
  }

  run() {
    this.create();
    this.showById();
    this.deleteById();
    this.findAll();
    this.findByIdAndUpdate();
  }
};

export default Users;
