import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import UserModel from '../models/user.mjs';
import { handleValidationErrors, loginValidator, userCreateValidator } from '../validators/index.mjs';

const JWT_SECRET = process.env.JWT_SECRET || 'Pikachu2';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide ou expiré' });
    }
    req.user = user;
    next();
  });
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function register(app, connect) {
  const User = connect.model('User', UserModel);

  app.post(
    '/auth/register',
    userCreateValidator,
    handleValidationErrors,
    async (req, res) => {
      try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
          return res.status(409).json({
            code: 409,
            message: 'Un utilisateur avec cet email existe déjà'
          });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
          ...req.body,
          password: hashedPassword
        });

        await user.save();
        const token = generateToken(user);
        res.status(201).json({
          user: user.toJSON(),
          token
        });
      } catch (err) {
        console.error('[ERROR] auth/register ->', err);
        res.status(500).json({
          code: 500,
          message: 'Erreur serveur'
        });
      }
    }
  );

  app.post(
    '/auth/login',
    loginValidator,
    handleValidationErrors,
    async (req, res) => {
      try {
        const user = await User.findOne({ email: req.body.email }).select('+password');
        if (!user) {
          return res.status(401).json({
            code: 401,
            message: 'Email ou mot de passe incorrect'
          });
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
          return res.status(401).json({
            code: 401,
            message: 'Email ou mot de passe incorrect'
          });
        }

        const token = generateToken(user);
        res.status(200).json({
          user: user.toJSON(),
          token
        });
      } catch (err) {
        console.error('[ERROR] auth/login ->', err);
        res.status(500).json({
          code: 500,
          message: 'Erreur serveur'
        });
      }
    }
  );
}
