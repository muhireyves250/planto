from sqlalchemy.orm import Session
from uuid import UUID
from app.models.fertilizer import FertilizerPlan

def create_fertilizer_plan(db: Session, plant_id: UUID, deficits: dict, recommendations: list, generated_by: str = "system"):
    # Extract Urea, DAP, NPK from recommendations list if present
    urea = next((r["kg"] for r in recommendations if r["type"] == "Urea"), 0.0)
    dap = next((r["kg"] for r in recommendations if r["type"] == "DAP"), 0.0)
    npk = next((r["kg"] for r in recommendations if r["type"].startswith("NPK")), 0.0)
    
    db_plan = FertilizerPlan(
        plant_id=plant_id,
        nitrogen_deficit=deficits.get("N", 0.0),
        phosphorus_deficit=deficits.get("P", 0.0),
        potassium_deficit=deficits.get("K", 0.0),
        urea_kg=urea,
        dap_kg=dap,
        npk_kg=npk,
        generated_by=generated_by
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

def get_latest_plan(db: Session, plant_id: UUID):
    return db.query(FertilizerPlan).filter(FertilizerPlan.plant_id == plant_id).order_by(FertilizerPlan.created_at.desc()).first()
