const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { PrismaClient } = require('@prisma/client');
const { RedisCache } = require('apollo-server-cache-redis');
const config = require('./config');
const schema = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const authenticateJWT = require('./middlewares/authentication');
const { securityHeaders, limiter } = require('./middlewares/security');
const { morganLogger, winstonLogger } = require('./middlewares/logging');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'minimal',
});

// Cache Redis para consultas
const cache = new RedisCache({
  host: config.redis.host,
  port: config.redis.port,
  defaultTTL: 60 * 60, // 1 hora
});

// Configuração inicial do app Express
const app = express();

// Middleware de segurança
app.use(securityHeaders);
app.use(limiter);

// Logs detalhados
app.use(morganLogger);
app.use(winstonLogger);

// Configurações de CORS
app.use(require('cors')({
  origin: (origin, callback) => {
    if (config.frontendUrl === origin || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  credentials: true,
}));

// Middleware de GraphQL com autenticação e contexto do Prisma
app.use(
  '/graphql',
  authenticateJWT, // Autentica todas as requisições
  graphqlHTTP((req) => ({
    schema: schema,
    rootValue: resolvers,
    context: { prisma, user: req.user, cache },
    graphiql: process.env.NODE_ENV !== 'production',
    customFormatErrorFn: (err) => {
      console.error('GraphQL Error:', err);
      return { message: 'Erro interno no servidor' };
    },
  }))
);

// Middleware para erros globais
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ message: 'Erro inesperado' });
});

// Iniciação do servidor
app.listen(config.port, () => {
  console.log(`Servidor rodando na porta ${config.port}`);
});
