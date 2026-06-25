# 🧠 EcoCredit Action Classifier

A lightweight **transfer-learning** image classifier (MobileNetV2) that predicts the
green-action *type* from a photo and auto-suggests it on the submit form. It
**augments** the LLM verifier — it doesn't replace it.

## Why this design
- **Cheap & offline** — runs in the Node backend via TensorFlow.js, no API cost.
- **Small dataset friendly** — transfer learning needs only ~100–200 images/class.
- **Graceful** — the `/api/ai/classify` route returns `{ available: false }` until a
  trained model is dropped in `server/ml-model/`, so the app works without it.

## Train it
```bash
cd ml
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 1. Put images in dataset/<ClassName>/*.jpg  (7 classes — see labels.json)
# 2. Run the notebook cells:
python train_classifier.py          # or open in VS Code as a notebook (# %% cells)

# 3. Convert the SavedModel to TensorFlow.js for the Node backend:
tensorflowjs_converter --input_format=tf_saved_model ml/saved_model server/ml-model
```

## Serve it
Install the inference runtime once in the backend, then restart:
```bash
cd server && npm install @tensorflow/tfjs-node
```
The backend auto-detects `server/ml-model/model.json`, loads it on first request,
and the submit form will start suggesting the action type with a confidence score.

## Classes
See [`labels.json`](./labels.json). The order **must** match the model's output layer
(the training script writes both from `class_names`).
