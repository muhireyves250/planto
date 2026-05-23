def calculate_health_score(current: dict, required: dict, previous_data=None):
    """
    health_score = 
        nutrient_score * 0.4 + 
        moisture_score * 0.3 + 
        pH_score * 0.2 + 
        stability_score * 0.1
    """
    
    # Nutrient Score (avg of how close NPK are to targets)
    n_score = max(0, 100 - abs(required["n"] - current["n"]) / (required["n"] or 1) * 100)
    p_score = max(0, 100 - abs(required["p"] - current["p"]) / (required["p"] or 1) * 100)
    k_score = max(0, 100 - abs(required["k"] - current["k"]) / (required["k"] or 1) * 100)
    nutrient_score = (n_score + p_score + k_score) / 3
    
    # Moisture Score
    moisture_score = max(0, 100 - abs(required["moisture"] - current["moisture"]))
    
    # pH Score
    ph_score = max(0, 100 - abs(required["ph"] - current["ph"]) * 20)
    
    # Stability Score (100 if no previous, else compare variance)
    stability_score = 100
    if previous_data:
        # Simple stability: if moisture changed more than 20% suddenly
        if abs(previous_data["moisture"] - current["moisture"]) > 20:
            stability_score = 50

    total_score = (
        nutrient_score * 0.4 + 
        moisture_score * 0.3 + 
        ph_score * 0.2 + 
        stability_score * 0.1
    )
    
    score = round(total_score, 1)
    
    if score >= 80:
        status = "Healthy"
    elif score >= 50:
        status = "Moderate Risk"
    else:
        status = "Critical"
        
    return score, status
