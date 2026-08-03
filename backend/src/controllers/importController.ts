import { Request, Response, NextFunction } from 'express';
import { importClientsFromBackup } from '../services/importService';

export const importController = {
  importBackup: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await importClientsFromBackup(req.body);
      return res.status(201).json({ message: 'Backup importado com sucesso.', ...result });
    } catch (error) {
      next(error);
    }
  },
};
