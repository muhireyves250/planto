import pickle
import numpy as np
import pandas as pd
import os
import warnings
warnings.filterwarnings('ignore')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
DATA_PATH = os.path.join(BASE_DIR, "Crop_recommendation_combined.csv")

# Global cache for crop requirements
_CROP_REQUIREMENTS = None

def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
    with open(MODEL_PATH, 'rb') as f:
        return pickle.load(f)

def load_requirements():
    """
    Load crop NPK averages from the dataset to use as remediation targets.
    """
    global _CROP_REQUIREMENTS
    if _CROP_REQUIREMENTS is None:
        if os.path.exists(DATA_PATH):
            df = pd.read_csv(DATA_PATH)
            # Standardize column names to lowercase to avoid KeyErrors
            df.columns = [c.lower() for c in df.columns]
            _CROP_REQUIREMENTS = df.groupby('label')[['n', 'p', 'k']].mean().to_dict('index')
        else:
            _CROP_REQUIREMENTS = {}
    return _CROP_REQUIREMENTS

def get_remediation_advice(n, p, k, target_crop):
    """
    Calculate NPK deficit and suggest fertilizer remediation.
    Returns a list of advice items.
    """
    reqs = load_requirements()
    advice_list = []
    
    if target_crop not in reqs:
        return ["No specific remediation data for this crop."]
    
    target = reqs[target_crop]
    diff_n = max(0, round(target['n'] - n, 1))
    diff_p = max(0, round(target['p'] - p, 1))
    diff_k = max(0, round(target['k'] - k, 1))
    
    if diff_n == 0 and diff_p == 0 and diff_k == 0:
        advice_list.append("Soil nutrients are optimal for this crop.")
    else:
        advice_list.append(f"Targeting {target_crop.upper()} NPK: {target['n']}, {target['p']}, {target['k']}")
        if diff_n > 0: advice_list.append(f"Supplement Nitrogen: {diff_n} units required. Use Urea or Ammonium Nitrate.")
        if diff_p > 0: advice_list.append(f"Supplement Phosphorus: {diff_p} units required. Use DAP.")
        if diff_k > 0: advice_list.append(f"Supplement Potassium: {diff_k} units required. Use Muriate of Potash.")

    return advice_list

def predict_crop(n, p, k, temperature, humidity, ph, rainfall):
    """
    Predict the most suitable crop or recommend 'Rest the Land'.
    Returns: crop, confidence, advice_list, status
    """
    model = load_model()
    
    # 1. Physical Soil Health Checks
    if ph < 3.8 or ph > 9.5:
        return "Rest Land", 0, ["Soil pH is extreme. Remediation with lime or gypsum required before planting."], "REST THE LAND"
    
    if (n < 5 and p < 5 and k < 5):
        return "Rest Land", 0, ["Soil nutrients are severely exhausted. Consider green manure or intense fertilization."], "REST THE LAND"

    # Create input feature array
    features = np.array([[n, p, k, temperature, humidity, ph, rainfall]])
    
    # 2. Probability Check (Confidence)
    probabilities = model.predict_proba(features)[0]
    max_confidence = float(np.max(probabilities))
    class_idx = np.argmax(probabilities)
    best_match_crop = model.classes_[class_idx]
    
    # Remediation advice for the best match
    advice_list = get_remediation_advice(n, p, k, best_match_crop)

    # Status mapping
    if max_confidence >= 0.85:
        status = "SAFE TO PLANT"
    elif max_confidence >= 0.65:
        status = "CAUTION"
    else:
        status = "REST THE LAND"

    if status == "REST THE LAND":
        advice_list.insert(0, f"Low Compatibility Match: {best_match_crop.upper()} detected but not recommended.")
        best_match_crop = "Rest Land"
        
    return best_match_crop, max_confidence, advice_list, status

# Testing block
if __name__ == "__main__":
    print("--- Testing Prediction API (Enhanced Version) ---")
    
    # Test Case 1: Healthy Soil (Rice)
    print("\n[TEST 1] Healthy Soil for Rice:")
    crop, conf, advice, status = predict_crop(90, 42, 43, 20.88, 82.0, 6.5, 202.9)
    print(f"=> Recommended: {crop.upper()}\n=> Confidence: {conf:.2f}\n=> Status: {status}\n=> Advice: {advice}")
