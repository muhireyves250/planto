# Standard nutrient requirements (N, P, K) for common crops
# Note: These values are targets for optimal growth

CROP_TARGETS = {
    "rice": {"n": 120, "p": 60, "k": 40, "ph": 6.5, "moisture": 80},
    "maize": {"n": 150, "p": 60, "k": 60, "ph": 6.0, "moisture": 70},
    "beans": {"n": 30, "p": 50, "k": 30, "ph": 6.8, "moisture": 60},
    "coffee": {"n": 150, "p": 50, "k": 150, "ph": 5.5, "moisture": 75},
}

def get_target_requirements(crop_name: str):
    return CROP_TARGETS.get(crop_name.lower(), {"n": 100, "p": 50, "k": 50, "ph": 6.5, "moisture": 70})
