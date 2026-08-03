import { Request, Response, NextFunction } from 'express';
import { createAdminUser, loginUser } from '../services/authService';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/authMiddleware';

export const authController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
      }

      const result = await loginUser(email, password);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  validateToken: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      return res.status(200).json({ valid: true, user: req.user });
    } catch (error) {
      next(error);
    }
  },

  createAdmin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
      }

      const user = await createAdminUser(name, email, password);
      return res.status(201).json({ message: 'Usuário administrador criado com sucesso.', user });
    } catch (error) {
      next(error);
    }
  },
};

export { authMiddleware };
