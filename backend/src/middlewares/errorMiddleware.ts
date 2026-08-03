import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(err: unknown, req: Request, res: Response, next: NextFunction) {
  console.error(err);

  if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: 'Erro interno do servidor.' });
}
