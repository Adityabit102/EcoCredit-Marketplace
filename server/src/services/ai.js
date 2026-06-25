const OpenAI = require('openai');
const env = require('../config/env');
const logger = require('../config/logger');
const { scoreClaim } = require('./validator');

let client = null;

function getClient() {
  if (client) return client;
  if (env.groqKey) {
    client = new OpenAI({ apiKey: env.groqKey, baseURL: 'https://api.groq.com/openai/v1' });
    client.isGroq = true;
  } else if (env.openaiKey) {
    client = new OpenAI({ apiKey: env.openaiKey });
    client.isGroq = false;
  }
  return client;
}

// Realistic per-unit CO2 sanity ceilings (tons) to catch absurd claims even when AI is down.
const CO2_SANITY = {
  Reforestation: 5, 'Clean Transport': 2, 'Solar Energy': 50, 'Wind Energy': 100,
  'Waste Reduction': 5, 'Energy Efficiency': 20, 'Urban Agriculture': 3,
};

function buildPrompt({ type, description, date, co2Estimate, hasGeotag }) {
  return `You are an expert environmental auditor AI verifying a green action for carbon credits.
Type: ${type}
Description: ${description}
Date: ${date}
CO2 Estimate Claimed: ${co2Estimate} tons
Geotag Provided: ${hasGeotag ? 'Yes' : 'No'}

Rules:
1. Judge whether the CO2 estimate is realistic for the action (e.g. one tree offsets ~0.02 t/yr; a household solar install ~3-5 t/yr). Flag wildly inflated claims.
2. If an image is supplied, confirm it matches the description.
3. Assess overall credibility and possible fraud.

Respond ONLY with valid JSON:
{"verified": boolean, "creditScore": number (0-100; <50 = rejected/fraud), "message": "short reason"}`;
}

async function verifyAction(input) {
  const ai = getClient();

  // scikit-learn validation engine — always-on, no API key required
  const ml = scoreClaim(input);

  if (!ai) {
    // Use the ML validator as the primary engine when no LLM is configured.
    if (ml.available) {
      return {
        verified: ml.legit,
        creditScore: Math.round(ml.probability * 100),
        message: ml.legit
          ? `Claim authenticated by the ML validation engine (${Math.round(ml.probability * 100)}% confidence).`
          : 'The validation model flagged this CO₂ estimate as unrealistic — sent for manual review.',
        source: 'ml',
        needsReview: !ml.legit,
      };
    }
    logger.warn('No AI provider or ML model — action routed to manual review');
    return pendingReview('AI verifier not configured');
  }

  const { imageUrl } = input;
  const messages = [
    { role: 'system', content: 'You are an AI verifier for green actions. Respond only with valid JSON.' },
  ];
  const promptText = buildPrompt(input);
  if (imageUrl) {
    messages.push({ role: 'user', content: [
      { type: 'text', text: promptText },
      { type: 'image_url', image_url: { url: imageUrl } },
    ] });
  } else {
    messages.push({ role: 'user', content: promptText });
  }

  try {
    const model = imageUrl ? env.aiVisionModel : env.aiTextModel;
    const res = await ai.chat.completions.create({
      model,
      messages,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(res.choices[0].message.content.trim());
    // Blend with the scikit-learn validator: if the model strongly flags the
    // claim as unrealistic, don't auto-verify even if the LLM was lenient.
    let verified = Boolean(parsed.verified) && parsed.creditScore >= 50;
    if (ml.available && ml.probability < 0.35) verified = false;
    return {
      verified,
      creditScore: clamp(parsed.creditScore, 0, 100),
      message: String(parsed.message || '').slice(0, 280),
      source: ml.available ? 'ai+ml' : 'ai',
    };
  } catch (err) {
    logger.error({ err: err.message }, 'LLM verification failed — falling back to ML validator');
    // Fall back to the scikit-learn engine before giving up to manual review.
    if (ml.available) {
      return {
        verified: ml.legit,
        creditScore: Math.round(ml.probability * 100),
        message: ml.legit ? 'Claim authenticated by the ML validation engine.' : 'Flagged as unrealistic by the validation model — manual review.',
        source: 'ml', needsReview: !ml.legit,
      };
    }
    return pendingReview('Automated verification unavailable; queued for manual review');
  }
}

function pendingReview(message) {
  return { verified: false, creditScore: 0, message, needsReview: true, source: 'fallback' };
}
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, Number(n) || 0)); }

const ECOBOT_SYSTEM = `You are EcoBot, the friendly assistant for EcoCredit — a marketplace for verified carbon credits.
Help users understand their carbon footprint, suggest impactful green actions, and explain how to earn/buy/retire credits.
Be concise (2-4 sentences), warm, and practical. 1 credit ≈ 0.1 tonne CO₂ offset.`;

// Conversational assistant. Falls back to a helpful canned reply if no AI key is set.
async function chat(messages = []) {
  const ai = getClient();
  const last = messages[messages.length - 1]?.content || '';
  if (!ai) {
    return {
      reply: `I'm EcoBot 🌿 — I can suggest green actions and explain credits. (Live AI is off until an API key is configured.) For "${String(last).slice(0, 60)}", a great start is tracking your footprint in the Calculator, then offsetting with verified credits in the Marketplace.`,
      source: 'fallback',
    };
  }
  try {
    const res = await ai.chat.completions.create({
      model: env.aiTextModel,
      messages: [{ role: 'system', content: ECOBOT_SYSTEM }, ...messages.slice(-8)],
      temperature: 0.6, max_tokens: 300,
    });
    return { reply: res.choices[0].message.content.trim(), source: 'ai' };
  } catch (err) {
    logger.error({ err: err.message }, 'EcoBot chat failed');
    return { reply: 'Sorry, I had trouble thinking just now. Try again in a moment! 🌱', source: 'error' };
  }
}

module.exports = { verifyAction, chat, CO2_SANITY };
