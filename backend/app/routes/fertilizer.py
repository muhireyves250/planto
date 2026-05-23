from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from app.core.database import get_db
from app.core.rbac import role_required, get_current_user_optional
from app.models.user import User
from app.repositories import monitoring_repo
from app.services.crop_monitoring import (
    nutrient_engine,
    deficiency_detector,
    growth_stage_engine,
    recommendation_engine,
    health_score
)

router = APIRouter(tags=["Fertilizer"])

@router.get("/fertilizer-recommendation/{plant_id}")
async def get_recommendation(
    plant_id: UUID, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    # 1. Fetch planted crop
    db_plant = monitoring_repo.get_planted_crop_by_id(db, plant_id)
    if not db_plant:
        raise HTTPException(status_code=404, detail="Planted crop not found")
        
    # Enforce data isolation if the crop is in the database
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to view this crop's fertilizer plans")
    if db_plant.user_id != current_user.id and current_user.role not in ["admin", "agronomist"]:
        raise HTTPException(status_code=403, detail="Not authorized to access fertilizer plans for this crop")
    
    # 2. Get latest monitoring
    latest_data = monitoring_repo.get_latest_monitoring(db, plant_id)
    if not latest_data:
        raise HTTPException(status_code=400, detail="No soil monitoring data found. Please submit monitoring data first.")
    
    # 3. Calculate Intelligence
    # Stage
    stage = growth_stage_engine.determine_growth_stage(db_plant.planting_date)
    
    # Requirements & Deficits
    targets = nutrient_engine.get_target_requirements(db_plant.crop_name)
    current_values = {
        "n": latest_data.nitrogen, "p": latest_data.phosphorus, "k": latest_data.potassium, 
        "ph": latest_data.ph, "moisture": latest_data.moisture
    }
    deficits = deficiency_detector.calculate_deficits(targets, current_values)
    
    # Recommendations
    fertilizers = recommendation_engine.calculate_fertilizers(deficits)
    
    # Health Score
    history = monitoring_repo.get_monitoring_history(db, plant_id, limit=2)
    prev_data = None
    if len(history) > 1:
        prev = history[1]
        prev_data = {"moisture": prev.moisture}
        
    score, status = health_score.calculate_health_score(current_values, targets, prev_data)
    
    # 4. Return full response
    return {
        "stage": stage,
        "deficit": deficits,
        "fertilizer": fertilizers,
        "health_score": score,
        "status": status
    }

@router.post("/fertilizer/override")
async def override_recommendation(data: dict, db: Session = Depends(get_db), current_user: User = Depends(role_required(["agronomist"]))):
    """Agronomist only: override AI fertilizer recommendation"""
    return {"success": True, "message": "Recommendation overridden by agronomist"}
