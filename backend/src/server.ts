import app from './app';
import { env } from './config/env';

app.listen(env.port, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${env.port}`);
  console.log(`Acesse em http://localhost:${env.port}`);
});
