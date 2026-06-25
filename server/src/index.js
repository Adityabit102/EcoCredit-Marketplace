const env = require('./config/env');
const logger = require('./config/logger');

// Optional error monitoring — activates only when SENTRY_DSN is set.
if (env.sentryDsn) {
  try {
    require('@sentry/node').init({ dsn: env.sentryDsn, environment: env.nodeEnv, tracesSampleRate: 0.1 });
    logger.info('Sentry initialized');
  } catch (err) {
    logger.warn({ err: err.message }, 'Sentry init skipped');
  }
}

const app = require('./app');
const connectDB = require('./config/db');
const { disconnectDB } = require('./config/db');
const { seedPlans } = require('./services/seed');
const { devSeed } = require('./services/devSeed');

let server;

async function start() {
  await connectDB();
  await seedPlans(); // idempotent — ensures plan docs exist
  await devSeed();   // populate demo data when the DB is empty

  server = app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`);
  });
}

// graceful shutdown so in-flight requests finish and DB closes cleanly
async function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
  process.exit(0);
}

['SIGTERM', 'SIGINT'].forEach((sig) => process.on(sig, () => shutdown(sig)));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

start().catch((err) => {
  logger.error({ err: err.message }, 'Failed to start server');
  process.exit(1);
});
