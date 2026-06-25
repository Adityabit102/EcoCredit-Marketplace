const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');

// Optional local ML classifier. Activates only when:
//   1) a trained model exists at server/ml-model/model.json, and
//   2) @tensorflow/tfjs-node is installed.
// Otherwise classify() returns { available: false } and the app is unaffected.

const MODEL_DIR = path.join(__dirname, '../../ml-model');
const MODEL_PATH = path.join(MODEL_DIR, 'model.json');
const DEFAULT_LABELS = ['Reforestation', 'Solar Energy', 'Wind Energy', 'Waste Reduction', 'Clean Transport', 'Energy Efficiency', 'Urban Agriculture'];

let tf = null;
let model = null;
let labels = DEFAULT_LABELS;
let loadAttempted = false;

async function ensureModel() {
  if (loadAttempted) return model;
  loadAttempted = true;
  if (!fs.existsSync(MODEL_PATH)) return null;
  try {
    tf = require('@tensorflow/tfjs-node');
    model = await tf.loadLayersModel(`file://${MODEL_PATH}`);
    const labelsFile = path.join(MODEL_DIR, 'labels.json');
    if (fs.existsSync(labelsFile)) labels = JSON.parse(fs.readFileSync(labelsFile, 'utf8'));
    logger.info('ML action classifier loaded');
  } catch (err) {
    logger.warn({ err: err.message }, 'Classifier load failed (is @tensorflow/tfjs-node installed?)');
    model = null;
  }
  return model;
}

async function toBuffer(imageUrl) {
  if (imageUrl.startsWith('data:')) return Buffer.from(imageUrl.split(',').pop(), 'base64');
  const res = await fetch(imageUrl);
  return Buffer.from(await res.arrayBuffer());
}

// Predict the action type from an image (data URL or http URL).
async function classify(imageUrl) {
  const m = await ensureModel();
  if (!m || !imageUrl) return { available: false };
  let input;
  try {
    const buf = await toBuffer(imageUrl);
    // model includes MobileNet preprocessing, so feed raw [0,255] floats
    input = tf.node.decodeImage(buf, 3).resizeBilinear([224, 224]).toFloat().expandDims(0);
    const pred = m.predict(input);
    const scores = await pred.data();
    pred.dispose();
    let best = 0;
    for (let i = 1; i < scores.length; i++) if (scores[i] > scores[best]) best = i;
    return { available: true, type: labels[best] || 'Unknown', confidence: Math.round(scores[best] * 100) };
  } catch (err) {
    logger.warn({ err: err.message }, 'Classification failed');
    return { available: false };
  } finally {
    if (input) input.dispose();
  }
}

module.exports = { classify };
