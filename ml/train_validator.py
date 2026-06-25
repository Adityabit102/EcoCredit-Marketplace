"""
EcoCredit AI Validation Engine — scikit-learn.

Authenticates carbon-credit *claims* (not images): given a submission's features
(action type, CO₂ estimate, geotag, description), predicts whether the claim is
legitimate or an unrealistic/inflated (fraudulent) offset.

Why tabular + scikit-learn: "is this CO₂ figure realistic for this action" is a
structured-data problem — exactly what logistic regression / random forests do
well. Trains in seconds, needs no image dataset, and exports tiny JSON weights
that the Node backend scores at submission time (no Python at runtime).

    pip install -r requirements.txt
    python train_validator.py
    # -> writes ../server/ml-model/validator.json
"""
import json
import math
import pathlib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score

# realistic CO₂ (tonnes) per typical action — the baseline each claim is judged against
TYPICAL = {
    "Reforestation": 0.5, "Solar Energy": 4.0, "Wind Energy": 8.0, "Waste Reduction": 1.5,
    "Clean Transport": 1.2, "Energy Efficiency": 2.0, "Urban Agriculture": 0.8,
}
TYPES = list(TYPICAL)
# ratio-vs-typical is the cross-type-normalized signal; raw co2 is intentionally
# excluded because the same value can be legit for one action type and fraud for another.
FEATURES = ["log_ratio", "has_geotag", "desc_norm"]


def make_features(type_name, co2, has_geotag, desc_len):
    base = TYPICAL.get(type_name, 1.0)
    ratio = max(co2 / base, 1e-6)
    return [math.log10(ratio), 1.0 if has_geotag else 0.0, min(desc_len, 500) / 500.0]


def generate(n=8000, seed=42):
    rng = np.random.default_rng(seed)
    X, y = [], []
    for _ in range(n):
        t = TYPES[rng.integers(0, len(TYPES))]
        base = TYPICAL[t]
        legit = rng.random() < 0.55
        if legit:
            # generous realistic band — scale of real actions varies a lot
            # (a community drive can offset many times a single sapling)
            co2 = base * rng.uniform(0.2, 8.0)
        else:
            if rng.random() < 0.8:
                co2 = base * rng.uniform(15, 1500)      # wildly inflated (e.g. 500t for a sapling)
            else:
                co2 = base * rng.uniform(0.001, 0.04)   # implausibly tiny
        # geotag/description are weak context, INDEPENDENT of legitimacy here, so the
        # model can't be fooled into approving an absurd CO2 just because a photo was geotagged
        geo = rng.random() < 0.6
        desc = int(rng.integers(0, 400))
        X.append(make_features(t, co2, geo, desc))
        y.append(1 if legit else 0)
    return np.array(X), np.array(y)


def main():
    X, y = generate()
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    scaler = StandardScaler().fit(Xtr)
    clf = LogisticRegression(max_iter=1000).fit(scaler.transform(Xtr), ytr)

    proba = clf.predict_proba(scaler.transform(Xte))[:, 1]
    acc = accuracy_score(yte, (proba >= 0.5).astype(int))
    auc = roc_auc_score(yte, proba)
    print(f"Validation accuracy: {acc:.3f}   ROC-AUC: {auc:.3f}")

    out = {
        "features": FEATURES,
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
        "coef": clf.coef_[0].tolist(),
        "intercept": float(clf.intercept_[0]),
        "typical": TYPICAL,
        "metrics": {"accuracy": round(acc, 3), "auc": round(auc, 3)},
        "model": "LogisticRegression (scikit-learn)",
    }
    dest = pathlib.Path(__file__).parent.parent / "server" / "ml-model"
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "validator.json").write_text(json.dumps(out, indent=2))
    print(f"Exported -> {dest / 'validator.json'}")


if __name__ == "__main__":
    main()
