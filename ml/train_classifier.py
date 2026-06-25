# %% [markdown]
# # EcoCredit Action Classifier — Transfer Learning (MobileNetV2)
#
# Trains a small image classifier that predicts the **green-action type** from a
# photo (Reforestation, Solar Energy, Wind Energy, …). It augments the LLM
# verifier: cheap, runs offline, and auto-suggests the action type on the
# submit form.
#
# **Dataset layout** (`ml/dataset/`):
# ```
# dataset/
#   Reforestation/        img1.jpg img2.jpg ...
#   Solar Energy/         ...
#   Wind Energy/          ...
#   Waste Reduction/      ...
#   Clean Transport/      ...
#   Energy Efficiency/    ...
#   Urban Agriculture/    ...
# ```
# Even ~100–200 images per class (scraped/your own) gives a usable demo model.

# %%
import json, pathlib, tensorflow as tf
from tensorflow.keras import layers, models

IMG_SIZE = 224
BATCH = 32
DATA_DIR = pathlib.Path(__file__).parent / "dataset"
OUT_DIR = pathlib.Path(__file__).parent / "saved_model"

# %% [markdown]
# ## 1. Load data with an 80/20 train/val split

# %%
train_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR, validation_split=0.2, subset="training", seed=42,
    image_size=(IMG_SIZE, IMG_SIZE), batch_size=BATCH)
val_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR, validation_split=0.2, subset="validation", seed=42,
    image_size=(IMG_SIZE, IMG_SIZE), batch_size=BATCH)

class_names = train_ds.class_names
print("Classes:", class_names)

AUTOTUNE = tf.data.AUTOTUNE
train_ds = train_ds.cache().shuffle(1000).prefetch(AUTOTUNE)
val_ds = val_ds.cache().prefetch(AUTOTUNE)

# %% [markdown]
# ## 2. MobileNetV2 base (frozen) + small classification head

# %%
data_aug = models.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.1),
    layers.RandomZoom(0.1),
])

base = tf.keras.applications.MobileNetV2(input_shape=(IMG_SIZE, IMG_SIZE, 3), include_top=False, weights="imagenet")
base.trainable = False

inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
x = data_aug(inputs)
x = tf.keras.applications.mobilenet_v2.preprocess_input(x)   # scales to [-1, 1]
x = base(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(len(class_names), activation="softmax")(x)
model = tf.keras.Model(inputs, outputs)
model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
model.summary()

# %% [markdown]
# ## 3. Train (feature extraction), then optionally fine-tune the top layers

# %%
model.fit(train_ds, validation_data=val_ds, epochs=10)

# fine-tune: unfreeze the last ~30 layers at a low LR
base.trainable = True
for layer in base.layers[:-30]:
    layer.trainable = False
model.compile(optimizer=tf.keras.optimizers.Adam(1e-5), loss="sparse_categorical_crossentropy", metrics=["accuracy"])
model.fit(train_ds, validation_data=val_ds, epochs=5)

# %% [markdown]
# ## 4. Export — SavedModel + labels, then convert to TensorFlow.js
#
# After running this, convert for the Node backend:
# ```bash
# pip install tensorflowjs
# tensorflowjs_converter --input_format=tf_saved_model \
#   ml/saved_model ../server/ml-model
# ```
# The backend auto-loads `server/ml-model/model.json` if present.

# %%
OUT_DIR.mkdir(exist_ok=True)
model.export(str(OUT_DIR))                       # TF SavedModel
(pathlib.Path(__file__).parent / "labels.json").write_text(json.dumps(class_names, indent=2))
print("Saved model + labels. Now run tensorflowjs_converter (see cell above).")
