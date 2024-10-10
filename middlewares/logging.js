const morgan = require('morgan');
const winston = require('winston');
const expressWinston = require('express-winston');

// Logs detalhados de requisições HTTP (usando Morgan e Winston)
const morganLogger = morgan('combined');

// Logs estruturados com Winston
const winstonLogger = expressWinston.logger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json()
  ),
  meta: true,
  expressFormat: true,
  colorize: false,
});

module.exports = { morganLogger, winstonLogger };
