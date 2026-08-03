# Backend Nexvg Manager

Este diretório contém a estrutura inicial do backend do projeto com:

- Node.js + Express
- Prisma ORM
- PostgreSQL
- Autenticação JWT
- Criptografia com bcrypt
- Arquitetura organizada em rotas, controllers, services, middlewares e config

## Como iniciar

1. Instale as dependências:
   npm install

2. Configure o banco PostgreSQL e o arquivo .env.

3. Gere o cliente Prisma:
   npx prisma generate

4. Rode as migrações:
   npx prisma migrate dev --name init

5. Inicie o servidor:
   npm run dev

## Endpoints iniciais

- GET /health
- POST /api/auth/login
- POST /api/auth/admin
- GET /api/auth/validate
