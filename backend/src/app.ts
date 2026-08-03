import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorMiddleware } from './middlewares/errorMiddleware';

const app = express();

app.use(
  cors({
    origin: env.corsOrigin.split(','),
    credentials: true,
  })
);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nexvg-manager-backend' });
});

app.use('/api', routes);
app.use(errorMiddleware);

export default app;
