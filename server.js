import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import schema from './graphql/schema.js';
import resolvers from './graphql/resolvers.js';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import depthLimit from 'graphql-depth-limit';
import helmet from 'helmet';
import compression from 'compression'; // Middleware para compressão de respostas
import dotenv from 'dotenv';
import DataLoader from 'dataloader'; // DataLoader para batching e caching de queries

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// Inicialização do Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
  pool: {
    min: 2, // Número mínimo de conexões
    max: 10, // Número máximo de conexões
  },
});


// Configuração do ambiente de produção
const isProduction = process.env.NODE_ENV === 'production';

// Configuração do CORS para permitir apenas domínios específicos em produção
const corsOptions = {
  origin: isProduction ? ['https://meudominio.com'] : '*', // Permitir todos os domínios em desenvolvimento
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true, // Permitir envio de cookies e headers autorizados
};

// Middleware para autenticação JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Auth Error: Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Auth Error: Invalid token' });
  }
};

// Limite de requisições para evitar DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP em 15 minutos
  message: 'Too many requests from this IP, please try again later.',
});

// Função para configurar DataLoader e caching de queries
const createLoaders = () => ({
  userLoader: new DataLoader(async (userIds) => {
    const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
    return userIds.map((id) => users.find((user) => user.id === id));
  }),
});

// Criação do app Express
const app = express();

// Aplicar o Helmet para adicionar cabeçalhos de segurança HTTP
app.use(helmet());

// Aplicar compressão das respostas
app.use(compression());

// Aplicar CORS com as opções definidas
app.use(cors(corsOptions));

// Adicionar limitador de requisições
app.use(limiter);

// Adicionar middleware de autenticação
app.use(authMiddleware);

// Configuração do GraphQL
app.use(
  '/graphql',
  graphqlHTTP((req) => ({
    schema: schema,
    rootValue: resolvers,
    context: { prisma, user: req.user, loaders: createLoaders() }, // Adicionar loaders e prisma ao contexto
    graphiql: !isProduction, // Habilitar GraphiQL apenas em desenvolvimento
    validationRules: [depthLimit(5)], // Limitar a profundidade das consultas
    customFormatErrorFn: (err) => {
      // Customizar o formato dos erros para não expor detalhes do servidor
      console.error(err); // Log do erro no servidor
      return {
        message: err.message,
        locations: err.locations,
        path: err.path,
      };
    },
  }))
);

// Definição da porta e início do servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running at ${isProduction ? 'https://meudominio.com' : 'http://localhost'}:${PORT}/graphql`);
});

/** Considerações
 * Conceitos: Performance, segurança e escalabilidade
 * A primeira pergunta correta a ser feita seria:
 * Aonde vou utilizar essa api? Vai servir meu front, vou disponibilizar a terceiros?
 * Se vou servir ao meu Front, vou limitar com cors e proteger contra ddos
 * Se vou servir terceiros vou criar uma estrutura de token, e limitar as requisiçoes
* Considerando o container de docker, vou deixar exposto minhas credenciais?
 **/
