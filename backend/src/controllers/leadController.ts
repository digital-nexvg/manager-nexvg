import { Request, Response, NextFunction } from 'express';
import { leadService } from '../services/leadService';

export const leadController = {
  list: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const leads = await leadService.list();
      return res.json(leads);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await leadService.createManual(req.body);
      return res.status(201).json(lead);
    } catch (error) {
      next(error);
    }
  },

  createPublic: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await leadService.createPublic(req.body);
      return res.status(201).json(lead);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const lead = await leadService.update(id ?? '', req.body);
      return res.json(lead);
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await leadService.remove(id ?? '');
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  convert: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await leadService.convertToClient(id ?? '');
      return res.status(result.alreadyConverted ? 200 : 201).json(result);
    } catch (error) {
      next(error);
    }
  },
};
