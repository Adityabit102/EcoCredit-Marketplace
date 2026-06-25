"""
Download a starter image dataset for each green-action class (via Bing).

    pip install bing-image-downloader
    python download_dataset.py

Produces ml/dataset/<ClassName>/*.jpg ready for train_classifier.py.
Review/clean the images afterwards — web results are noisy, and a clean set of
~100-150 images per class beats 300 messy ones.
"""
import pathlib
import shutil
from bing_image_downloader import downloader

# search terms per class (folder names MUST match labels.json exactly)
QUERIES = {
    "Reforestation":     ["tree planting volunteers", "reforestation saplings planting"],
    "Solar Energy":      ["rooftop solar panels installation", "solar power farm"],
    "Wind Energy":       ["wind turbine farm", "wind energy turbines field"],
    "Waste Reduction":   ["recycling bins waste sorting", "composting food waste"],
    "Clean Transport":   ["electric car charging station", "people cycling city commute"],
    "Energy Efficiency": ["LED light bulb installation", "home wall insulation"],
    "Urban Agriculture": ["community vegetable garden", "rooftop urban farm plants"],
}
PER_QUERY = 80  # ~160 images/class

OUT = pathlib.Path(__file__).parent / "dataset"
TMP = OUT / "_tmp"

for cls, queries in QUERIES.items():
    dest = OUT / cls
    dest.mkdir(parents=True, exist_ok=True)
    for q in queries:
        downloader.download(q, limit=PER_QUERY, output_dir=str(TMP),
                            adult_filter_off=True, force_replace=False, timeout=20)
        src = TMP / q
        if src.exists():
            for i, f in enumerate(sorted(src.glob("*"))):
                if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                    shutil.move(str(f), str(dest / f"{cls.replace(' ', '_')}_{i}{f.suffix.lower()}"))
    print(f"✓ {cls}: {len(list(dest.glob('*')))} images")

shutil.rmtree(TMP, ignore_errors=True)
print("\nDone. Review ml/dataset/, delete obviously-wrong images, then run train_classifier.py")
