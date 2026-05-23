def generate_alerts(current_values: dict, targets: dict, health_score: float, status: str, crop_name: str) -> list:
    """
    Generate alerts based on precision agriculture rules:
    - moisture below threshold
    - pH critical
    - severe nutrient deficiency
    - health score below safe limit
    """
    alerts = []

    # 1. Moisture below threshold
    target_moisture = targets.get("moisture", 70)
    current_moisture = current_values.get("moisture", 0)
    if current_moisture < target_moisture - 15:
        alerts.append({
            "type": "critical" if current_moisture < target_moisture - 30 else "warning",
            "message": f"Low moisture detected for {crop_name}. Current: {current_moisture}%, Target: {target_moisture}%."
        })

    # 2. pH critical
    target_ph = targets.get("ph", 6.5)
    current_ph = current_values.get("ph", 0)
    if abs(current_ph - target_ph) > 0.8:
        alerts.append({
            "type": "warning",
            "message": f"Critical pH level deviation for {crop_name}. Current: {current_ph}, Target: {target_ph}."
        })

    # 3. Severe nutrient deficiency
    # Required keys are uppercase N, P, K from deficiency calculation or lowercase in targets
    for key, target_key in [("N", "n"), ("P", "p"), ("K", "k")]:
        curr_val = current_values.get(target_key, 0)
        targ_val = targets.get(target_key, 50)
        if curr_val < (targ_val * 0.5):
            alerts.append({
                "type": "warning",
                "message": f"Severe nutrient deficiency: {key} is low for {crop_name}."
            })

    # 4. Health score below safe limit
    if health_score < 60:
        alerts.append({
            "type": "critical",
            "message": f"Critical health status for {crop_name}! Health score: {health_score}."
        })

    return alerts
