const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const env = require('./config/env');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// behind a load balancer / reverse proxy in prod — needed for correct client IPs (rate limiting) & secure cookies
app.set('trust proxy', 1);

app.use(helmet());

app.use(cors({
  origin: env.isProd
    ? [env.clientUrl]
    : [env.clientUrl, 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

// Stripe webhook needs the raw body for signature verification — skip JSON parsing there
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') return next();
  express.json({ limit: '10mb' })(req, res, next);
});
app.use(cookieParser());

// structured request logging
if (!env.isTest) {
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));
}

app.use('/api', apiLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/actions', require('./routes/actions'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/ai', require('./routes/ai'));

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use(errorHandler);

module.exports = app;
