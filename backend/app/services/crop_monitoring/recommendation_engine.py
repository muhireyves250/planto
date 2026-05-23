def calculate_fertilizers(deficits: dict, stage: str = "vegetative"):
    """
    Rules:
    Nitrogen -> Urea (46%)
    Phosphorus -> DAP (46%)
    Potassium -> NPK (17%)
    """
    recommendations = []
    
    if deficits.get("N", 0) > 0:
        urea = deficits["N"] / 0.46
        recommendations.append({
            "type": "Urea", 
            "kg": round(urea, 2),
            "nutrient_target": "Nitrogen (N)",
            "reason": f"Nitrogen levels are below optimal range for {stage} growth."
        })
        
    if deficits.get("P", 0) > 0:
        dap = deficits["P"] / 0.46
        recommendations.append({
            "type": "DAP", 
            "kg": round(dap, 2),
            "nutrient_target": "Phosphorus (P)",
            "reason": "Phosphorus deficiency detected."
        })
        
    if deficits.get("K", 0) > 0:
        npk = deficits["K"] / 0.17
        recommendations.append({
            "type": "NPK (17%)", 
            "kg": round(npk, 2),
            "nutrient_target": "Potassium (K)",
            "reason": "Potassium deficiency detected."
        })
        
    return recommendations

