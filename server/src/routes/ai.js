const router = require('express').Router();
const auth = require('../middleware/auth');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { chat } = require('../services/ai');
const { classify } = require('../services/classifier');
const { chatLimiter } = require('../middleware/rateLimiter');

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(2000),
  })).min(1).max(20),
});

router.post('/chat', auth, chatLimiter, validate(chatSchema), async (req, res, next) => {
  try {
    const result = await chat(req.body.messages);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Suggest the action type from an uploaded image using the local ML classifier.
const classifySchema = z.object({ imageUrl: z.string().min(1) });
router.post('/classify', auth, chatLimiter, validate(classifySchema), async (req, res, next) => {
  try {
    res.json(await classify(req.body.imageUrl));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
