import pickle
import numpy as np
import pandas as pd
import os
import warnings
warnings.filterwarnings('ignore')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
DATA_PATH = os.path.join(BASE_DIR, "Crop_recommendation_sensor.csv")

_CROP_REQUIREMENTS = None
_MODEL = None

def load_model():
    global _MODEL
    if _MODEL is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        with open(MODEL_PATH, 'rb') as f:
            _MODEL = pickle.load(f)
    return _MODEL

def load_requirements():
    global _CROP_REQUIREMENTS
    if _CROP_REQUIREMENTS is None:
        if os.path.exists(DATA_PATH):
            df = pd.read_csv(DATA_PATH)
            df.columns = [c.lower() for c in df.columns]
            _CROP_REQUIREMENTS = df.groupby('label')[['n', 'p', 'k']].mean().to_dict('index')
        else:
            _CROP_REQUIREMENTS = {}
    return _CROP_REQUIREMENTS


def get_remediation_advice(n, p, k, target_crop, role: str = "farmer"):
    """
    Generate soil correction advice tailored to the user's role.
    - farmer    : plain, action-oriented language, no technical units
    - agronomist: full technical detail with kg/ha and product names
    """
    reqs = load_requirements()
    advice_list = []
    is_farmer = role == "farmer"

    if target_crop not in reqs:
        if is_farmer:
            return ["Your soil is in reasonable condition. Ask your local agronomist for advice on the best crop to plant this season."]
        return ["No specific remediation data available for this crop. Consult soil science references for manual assessment."]

    target = reqs[target_crop]
    t_n = round(target['n'])
    t_p = round(target['p'])
    t_k = round(target['k'])

    diff_n = max(0, round(t_n - n, 1))
    diff_p = max(0, round(t_p - p, 1))
    diff_k = max(0, round(t_k - k, 1))

    crop_title = target_crop.title()

    if diff_n == 0 and diff_p == 0 and diff_k == 0:
        if is_farmer:
            advice_list.append(
                f"Great news — your soil is ready for {crop_title}! "
                f"Your soil has all the nutrients it needs. You can go ahead and plant."
            )
        else:
            advice_list.append(
                f"Soil nutrient profile is well-balanced for {crop_title}. "
                f"N: {t_n} kg/ha · P: {t_p} kg/ha · K: {t_k} kg/ha — all within target range. No fertiliser correction required."
            )
        return advice_list

    # Opening summary
    if is_farmer:
        advice_list.append(
            f"Your soil needs a little work before it is ready for {crop_title}. "
            f"Follow these steps and your field will be in good shape for planting."
        )
    else:
        advice_list.append(
            f"{crop_title} requires N: {t_n} kg/ha · P: {t_p} kg/ha · K: {t_k} kg/ha. "
            f"Current readings are below target. Apply the following corrections before planting."
        )

    # Nitrogen
    if diff_n > 0:
        if is_farmer:
            advice_list.append(
                f"Your soil is low on nitrogen — the nutrient that helps crops grow tall and green. "
                f"Buy Urea fertiliser from your local agro-dealer and spread it evenly across your field before planting."
            )
        else:
            advice_list.append(
                f"Nitrogen deficit: {diff_n} kg/ha below target ({t_n} kg/ha). "
                f"Apply Urea (46% N) or Ammonium Nitrate to restore nitrogen levels and support vegetative growth."
            )

    # Phosphorus
    if diff_p > 0:
        if is_farmer:
            advice_list.append(
                f"Your soil needs more phosphorus — this helps roots grow strong so the crop can take in water and food. "
                f"Buy DAP fertiliser and mix it into the soil before planting."
            )
        else:
            advice_list.append(
                f"Phosphorus deficit: {diff_p} kg/ha below target ({t_p} kg/ha). "
                f"Apply DAP (Di-ammonium Phosphate, 46% P₂O₅) to enhance root development and early crop establishment."
            )

    # Potassium
    if diff_k > 0:
        if is_farmer:
            advice_list.append(
                f"Your soil is short on potassium — this keeps the crop strong and helps it survive dry weather. "
                f"Buy MOP (Muriate of Potash) fertiliser and apply it to the field before planting."
            )
        else:
            advice_list.append(
                f"Potassium deficit: {diff_k} kg/ha below target ({t_k} kg/ha). "
                f"Apply Muriate of Potash (MOP, 60% K₂O) to improve drought tolerance and crop immunity."
            )

    return advice_list


def predict_crop(n, p, k, temperature, ph, ec, moisture, role: str = "farmer"):
    """
    Predict the most suitable crop or recommend resting the land.
    Returns: crop, confidence, advice_list, status
    """
    model = load_model()
    is_farmer = role == "farmer"

    # Hard checks before running the model
    if ph < 3.8 or ph > 9.5:
        if is_farmer:
            return (
                "Rest Land", 0,
                [
                    "Your soil's acidity level is too extreme for any crop to grow right now.",
                    "If your soil is too acidic (pH below 5.5), apply agricultural lime. "
                    "If it is too alkaline (pH above 8.5), apply gypsum. Ask your agro-dealer for the right amount.",
                    "Wait 4 to 6 weeks after treatment, then test your soil again before planting."
                ],
                "REST THE LAND"
            )
        return (
            "Rest Land", 0,
            [
                f"Soil pH ({ph}) is outside the viable range (3.8–9.5) for crop production.",
                "Apply agricultural lime for acidic conditions (pH < 5.5) or gypsum for alkaline conditions (pH > 8.5).",
                "Re-test soil pH after 4–6 weeks of amendment before resuming planting."
            ],
            "REST THE LAND"
        )

    if n < 5 and p < 5 and k < 5:
        if is_farmer:
            return (
                "Rest Land", 0,
                [
                    "Your soil has almost no nutrients left — it is too weak to grow any crop this season.",
                    "Add compost, animal manure, or a complete NPK fertiliser to feed your soil.",
                    "Give the soil at least one full season to recover before you plant again."
                ],
                "REST THE LAND"
            )
        return (
            "Rest Land", 0,
            [
                "Soil nutrient profile is critically depleted: N, P, and K are all below 5 kg/ha.",
                "Apply green manure, organic compost, or a balanced NPK fertiliser to restore soil organic matter.",
                "Allow a minimum of one season recovery before planting a commercial crop."
            ],
            "REST THE LAND"
        )

    features = np.array([[n, p, k, temperature, ph, ec, moisture]])
    probabilities = model.predict_proba(features)[0]
    max_confidence = float(np.max(probabilities))
    class_idx = np.argmax(probabilities)
    best_match_crop = model.classes_[class_idx]

    advice_list = get_remediation_advice(n, p, k, best_match_crop, role)

    if max_confidence >= 0.85:
        status = "SAFE TO PLANT"
    elif max_confidence >= 0.65:
        status = "CAUTION"
    else:
        status = "REST THE LAND"

    if status == "REST THE LAND":
        # Return the actual crop so the frontend can offer the farmer a choice.
        # advice_list already holds the remediation steps for that crop.
        # The frontend uses: status=="REST THE LAND" && crop!="Rest Land" → show choice UI.
        pass

    return best_match_crop, max_confidence, advice_list, status


if __name__ == "__main__":
    print("--- Testing Prediction API ---")
    print("\n[FARMER] Healthy Soil for Rice:")
    crop, conf, advice, status = predict_crop(90, 42, 43, 20.88, 6.5, 1.2, 85.0, role="farmer")
    print(f"=> {crop} | {conf:.2f} | {status}\n" + "\n".join(f"  {i+1}. {a}" for i, a in enumerate(advice)))

    print("\n[AGRONOMIST] Healthy Soil for Rice:")
    crop, conf, advice, status = predict_crop(90, 42, 43, 20.88, 6.5, 1.2, 85.0, role="agronomist")
    print(f"=> {crop} | {conf:.2f} | {status}\n" + "\n".join(f"  {i+1}. {a}" for i, a in enumerate(advice)))
