import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorMiddleware } from './middlewares/errorMiddleware';

const app = express();
const privateCors = cors({
  origin: env.corsOrigin.split(','),
  credentials: true,
});
const publicCors = cors({
  origin: true,
  credentials: false,
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/leads/public')) {
    return publicCors(req, res, next);
  }

  return privateCors(req, res, next);
});

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'nexvg-manager-backend' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nexvg-manager-backend' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nexvg-manager-backend' });
});

app.use('/api', routes);
app.use(errorMiddleware);

export default app;
