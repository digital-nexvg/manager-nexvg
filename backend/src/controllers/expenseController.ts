import { NextFunction, Request, Response } from 'express';
import { expenseService } from '../services/expenseService';

export const expenseController = {
  list: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return res.json(await expenseService.list());
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.status(201).json(await expenseService.create(req.body));
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await expenseService.remove(id ?? '');
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};