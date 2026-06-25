const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// Scores carbon-credit claims with the scikit-learn-trained logistic-regression
// model (weights exported to ml-model/validator.json). Pure JS at runtime — no
// Python dependency in production. Returns { available, probability, legit }.

const MODEL_PATH = path.join(__dirname, '../../ml-model/validator.json');
let model = null;
let loaded = false;

function load() {
  if (loaded) return model;
  loaded = true;
  try {
    if (fs.existsSync(MODEL_PATH)) {
      model = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8'));
      logger.info(`Claim validator loaded (acc ${model.metrics?.accuracy}, auc ${model.metrics?.auc})`);
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Validator model load failed');
    model = null;
  }
  return model;
}

// Must mirror make_features() in ml/train_validator.py exactly.
function buildFeatures(m, { type, co2Estimate, hasGeotag, description }) {
  const base = m.typical[type] || 1;
  const ratio = Math.max((co2Estimate || 0) / base, 1e-6);
  return [
    Math.log10(ratio),
    hasGeotag ? 1 : 0,
    Math.min((description || '').length, 500) / 500,
  ];
}

function scoreClaim(claim) {
  const m = load();
  if (!m) return { available: false };
  const f = buildFeatures(m, claim);
  let z = m.intercept;
  for (let i = 0; i < f.length; i++) z += m.coef[i] * ((f[i] - m.mean[i]) / m.scale[i]);
  const probability = 1 / (1 + Math.exp(-z));
  return { available: true, probability, legit: probability >= 0.5 };
}

module.exports = { scoreClaim };
