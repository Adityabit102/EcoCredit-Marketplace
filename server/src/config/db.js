const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

let cached = null;
let mongod = null;

async function connectDB() {
  if (cached) return cached;

  let uri = env.mongoUri;

  if (!uri) {
    if (env.isProd) {
      // env.js already guards this, but never silently spin up a throwaway DB in prod
      throw new Error('MONGO_URI is required in production');
    }
    logger.warn('No MONGO_URI provided — starting ephemeral in-memory MongoDB replica set (dev only)');
    // a replica set (not a standalone) is required so multi-document transactions work in dev
    const { MongoMemoryReplSet } = require('mongodb-memory-server');
    mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    uri = mongod.getUri();
  }

  mongoose.set('strictQuery', true);

  try {
    cached = await mongoose.connect(uri, {
      maxPoolSize: 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    logger.info({ host: mongoose.connection.host }, 'MongoDB connected');
    return cached;
  } catch (err) {
    logger.error({ err: err.message }, 'MongoDB connection failed');
    throw err;
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
  cached = null;
}

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
