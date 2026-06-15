import re

# Nutrient use-efficiency factors (fraction actually absorbed by the crop)
USE_EFFICIENCY = {
    "N": 0.55,  # Urea: ~55% of applied N is taken up
    "P": 0.25,  # DAP:  ~25% of applied P is taken up
    "K": 0.65,  # NPK:  ~65% of applied K is taken up
}


def parse_farm_size_ha(farm_size_str: str | None) -> float:
    """
    Parse farm size string (e.g. '5 hectares', '2.5ha', '3 acres') to hectares.
    Falls back to 1.0 ha if unparseable.
    """
    if not farm_size_str:
        return 1.0
    s = farm_size_str.lower().strip()
    match = re.search(r"[\d.]+", s)
    if not match:
        return 1.0
    value = float(match.group())
    if "acre" in s:
        return round(value * 0.404686, 4)  # 1 acre = 0.404686 ha
    return value  # assume hectares


def calculate_fertilizers(deficits: dict, stage: str = "vegetative", farm_size_str: str | None = None):
    """
    Professional fertilizer quantity formula:

        Total kg = (Nutrient Deficit [kg/ha]  ÷  Nutrient Content %  ÷  Use Efficiency)  ×  Farm Area [ha]

    Fertilizer products:
        Nitrogen   → Urea  (46% N,   55% use efficiency)
        Phosphorus → DAP   (46% P,   25% use efficiency)
        Potassium  → NPK   (17% K,   65% use efficiency)
    """
    farm_ha = parse_farm_size_ha(farm_size_str)
    recommendations = []

    if deficits.get("N", 0) > 0:
        deficit = deficits["N"]
        kg_per_ha = deficit / 0.46 / USE_EFFICIENCY["N"]
        total_kg = round(kg_per_ha * farm_ha, 2)
        recommendations.append({
            "type": "Urea",
            "kg_per_ha": round(kg_per_ha, 2),
            "total_kg": total_kg,
            "farm_size_ha": farm_ha,
            "nutrient_target": "Nitrogen (N)",
            "formula": f"({deficit} kg/ha ÷ 0.46 ÷ 0.55) × {farm_ha} ha = {total_kg} kg",
            "reason": f"Nitrogen levels are below optimal range for {stage} growth."
        })

    if deficits.get("P", 0) > 0:
        deficit = deficits["P"]
        kg_per_ha = deficit / 0.46 / USE_EFFICIENCY["P"]
        total_kg = round(kg_per_ha * farm_ha, 2)
        recommendations.append({
            "type": "DAP",
            "kg_per_ha": round(kg_per_ha, 2),
            "total_kg": total_kg,
            "farm_size_ha": farm_ha,
            "nutrient_target": "Phosphorus (P)",
            "formula": f"({deficit} kg/ha ÷ 0.46 ÷ 0.25) × {farm_ha} ha = {total_kg} kg",
            "reason": "Phosphorus deficiency detected. DAP improves root development and early crop establishment."
        })

    if deficits.get("K", 0) > 0:
        deficit = deficits["K"]
        kg_per_ha = deficit / 0.17 / USE_EFFICIENCY["K"]
        total_kg = round(kg_per_ha * farm_ha, 2)
        recommendations.append({
            "type": "NPK (17%)",
            "kg_per_ha": round(kg_per_ha, 2),
            "total_kg": total_kg,
            "farm_size_ha": farm_ha,
            "nutrient_target": "Potassium (K)",
            "formula": f"({deficit} kg/ha ÷ 0.17 ÷ 0.65) × {farm_ha} ha = {total_kg} kg",
            "reason": "Potassium deficiency detected. Improves drought resistance and fruit quality."
        })

    return recommendations
