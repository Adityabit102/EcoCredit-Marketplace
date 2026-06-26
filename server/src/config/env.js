require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI,

  // auth
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS, 10) || 30,
  maxSessionsPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER, 10) || 10,

  // ai
  groqKey: process.env.GROQ_API_KEY,
  openaiKey: process.env.OPENAI_API_KEY,
  aiVisionModel: process.env.AI_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
  aiTextModel: process.env.AI_TEXT_MODEL || 'llama-3.3-70b-versatile',

  // blockchain
  rpcUrl: process.env.RPC_URL,
  privateKey: process.env.PRIVATE_KEY,
  contractAddress: process.env.CONTRACT_ADDRESS,
  chainId: parseInt(process.env.CHAIN_ID, 10) || 11155111, // Sepolia

  // payments
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  // email (Resend) + monitoring
  resendApiKey: process.env.RESEND_API_KEY,
  mailFrom: process.env.MAIL_FROM || 'EcoCredit <onboarding@resend.dev>',
  sentryDsn: process.env.SENTRY_DSN,
  appName: process.env.APP_NAME || 'EcoCredit India',

  // misc
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  get isProd() { return this.nodeEnv === 'production'; },
  get isTest() { return this.nodeEnv === 'test'; },
};

// fail fast on missing critical secrets (skipped in test)
if (env.nodeEnv !== 'test') {
  const required = ['jwtSecret', 'jwtRefreshSecret'];
  // a real database is mandatory in production — the in-memory fallback is dev-only
  if (env.isProd) required.push('mongoUri');

  const missing = required.filter((k) => !env[k]);
  if (missing.length) {
    console.error(`FATAL: missing required env var(s): ${missing.join(', ')}`);
    process.exit(1);
  }

  if (env.isProd && (env.jwtSecret.length < 32 || env.jwtRefreshSecret.length < 32)) {
    console.error('FATAL: JWT secrets must be at least 32 chars in production');
    process.exit(1);
  }
}

module.exports = env;
