import asyncio
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.core.rbac import role_required, get_current_user
from app.models.user import User
from app.schemas import monitoring as mon_schemas
from app.repositories import monitoring_repo
from app.services.crop_monitoring import (
    nutrient_engine,
    deficiency_detector,
    growth_stage_engine,
    recommendation_engine,
    health_score,
    alert_engine
)
from app.models.planted_crop import PlantedCrop, CropHealthHistory
from app.models.fertilizer import FertilizerPlan
from app.models.alert import Alert
from app.services.cascade_delete import delete_planted_crop_cascade

router = APIRouter(tags=["Monitoring"])

@router.post("/plant-crop", response_model=mon_schemas.PlantedCropDB)
async def plant_crop(user_id: UUID, crop_name: str, status: str = "pending", farm_id: UUID = None, db: Session = Depends(get_db), current_user: User = Depends(role_required(["farmer", "agronomist", "admin"]))):
    actual_user_id = current_user.id if current_user.role in ["farmer", "agronomist"] else user_id
    return monitoring_repo.create_planted_crop(db=db, user_id=actual_user_id, crop_name=crop_name, status=status, farm_id=farm_id)

@router.get("/planted-crops/{user_id}", response_model=List[mon_schemas.PlantedCropDB])
async def get_my_crops(user_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    actual_user_id = current_user.id if current_user.role == "farmer" else user_id
    return monitoring_repo.get_planted_crops_by_user(db=db, user_id=actual_user_id)

@router.get("/planted-crops", response_model=List[mon_schemas.PlantedCropDB])
async def get_all_crops(db: Session = Depends(get_db), current_user: User = Depends(role_required(["agronomist", "admin"]))):
    return monitoring_repo.get_all_planted_crops(db=db)

@router.post("/soil-monitoring/{plant_id}")
async def add_monitoring(plant_id: UUID, data: mon_schemas.MonitoringCreate, db: Session = Depends(get_db), current_user: User = Depends(role_required(["farmer", "agronomist", "admin"]))):
    # 1. Fetch planted crop
    db_plant = monitoring_repo.get_planted_crop_by_id(db, plant_id)
    if not db_plant:
        raise HTTPException(status_code=404, detail="Planted crop not found")
    if db_plant.user_id != current_user.id and current_user.role not in ["admin", "agronomist"]:
        raise HTTPException(status_code=403, detail="Not authorized to log telemetry for this crop")
        
    # 2. Save soil data
    new_entry = monitoring_repo.create_monitoring_entry(db=db, plant_id=plant_id, data=data, user_id=current_user.id)
    
    # 3. Calculate Intelligence
    # Stage — use farmer-chosen phase if provided, otherwise calculate from planting date
    stage = data.growth_stage if data.growth_stage else growth_stage_engine.determine_growth_stage(db_plant.planting_date)
    
    # Requirements & Deficits
    targets = nutrient_engine.get_target_requirements(db_plant.crop_name)
    current_values = {
        "n": data.n, "p": data.p, "k": data.k, 
        "ph": data.ph, "moisture": data.moisture
    }
    deficits = deficiency_detector.calculate_deficits(targets, current_values)
    
    # Health Score
    history = monitoring_repo.get_monitoring_history(db, plant_id, limit=2)
    prev_data = None
    if len(history) > 1:
        prev = history[1]
        prev_data = {"moisture": prev.moisture}
        
    score, status = health_score.calculate_health_score(current_values, targets, prev_data)

    # Recommendations
    fertilizers = recommendation_engine.calculate_fertilizers(deficits, stage)
    
    # 4. Save Fertilizer Plans (one per recommendation, or one default if empty)
    if fertilizers:
        for rec in fertilizers:
            db_fertilizer_plan = FertilizerPlan(
                plant_id=plant_id,
                nitrogen_deficit=deficits.get("N", 0) if rec["type"] == "Urea" else 0,
                phosphorus_deficit=deficits.get("P", 0) if rec["type"] == "DAP" else 0,
                potassium_deficit=deficits.get("K", 0) if rec["type"] == "NPK (17%)" else 0,
                urea_kg=rec["total_kg"] if rec["type"] == "Urea" else 0.0,
                dap_kg=rec["total_kg"] if rec["type"] == "DAP" else 0.0,
                npk_kg=rec["total_kg"] if rec["type"] == "NPK (17%)" else 0.0,
                fertilizer_type=rec["type"],
                quantity_kg=rec["total_kg"],
                nutrient_target=rec["nutrient_target"],
                explanation=rec["reason"],
                generated_by="system"
            )
            db.add(db_fertilizer_plan)
    else:
        db_fertilizer_plan = FertilizerPlan(
            plant_id=plant_id,
            nitrogen_deficit=0.0,
            phosphorus_deficit=0.0,
            potassium_deficit=0.0,
            urea_kg=0.0,
            dap_kg=0.0,
            npk_kg=0.0,
            fertilizer_type="None",
            quantity_kg=0.0,
            nutrient_target="None",
            explanation="Optimal soil balance. No synthetic adjustments needed.",
            generated_by="system"
        )
        db.add(db_fertilizer_plan)

    # 5. Save Health History
    db_health_history = CropHealthHistory(
        plant_id=plant_id,
        health_score=score,
        risk_level=status,
        stage=stage,
        notes=f"Analyzed by precision engine. Score: {score} ({status})."
    )
    db.add(db_health_history)
    
    # 6. Generate & Save Alerts
    generated_alerts = alert_engine.generate_alerts(
        current_values=current_values,
        targets=targets,
        health_score=score,
        status=status,
        crop_name=db_plant.crop_name
    )
    
    from app.services import notification_service

    for alert_data in generated_alerts:
        title = "Crop Alert" if alert_data["type"] != "critical" else "⚠️ Critical Crop Alert"
        new_alert = Alert(
            user_id=current_user.id,
            plant_id=plant_id,
            type=alert_data["type"],
            category="soil",
            title=title,
            message=alert_data["message"],
            action_url="/monitoring",
        )
        db.add(new_alert)
    
        # Fan-out to managing agronomist if this is a managed farm
        from app.models.farm import Farm
        farm_obj = db.query(Farm).filter(Farm.id == db_plant.farm_id).first()
        if farm_obj and farm_obj.agronomist_id:
            db.add(Alert(
                user_id=farm_obj.agronomist_id,
                plant_id=plant_id,
                type=alert_data["type"],
                category="soil",
                title=f"[{db_plant.crop_name.title()}] {title}",
                message=alert_data["message"],
                action_url=f"/my-farms",
            ))
    
    db.commit()
    
    # Broadcast via SSE, push, and email after commit (non-blocking)
    from app.services.email_service import send_alert_email
    
    for alert_data in generated_alerts:
        title = "Crop Alert" if alert_data["type"] != "critical" else "⚠️ Critical Crop Alert"
        payload = {
            "type": "alert",
            "alert_type": alert_data["type"],
            "title": title,
            "message": alert_data["message"],
            "action_url": "/monitoring",
        }
        # SSE: instant in-app delivery
        asyncio.create_task(
            notification_service.broadcast_sse(str(current_user.id), payload)
        )
        # Web Push: for critical alerts only (high signal, avoids notification fatigue)
        if alert_data["type"] == "critical":
            asyncio.create_task(
                notification_service.send_push(db, current_user.id, title, alert_data["message"], "/monitoring")
            )
        # Email: for warning + critical alerts
        if alert_data["type"] in ("warning", "critical"):
            asyncio.create_task(send_alert_email(
                to_email=current_user.email,
                title=title,
                message=alert_data["message"],
                alert_type=alert_data["type"],
                crop_name=db_plant.crop_name,
                farm_name=getattr(farm_obj, "name", ""),
                action_url="/monitoring",
            ))
        # Also email the agronomist for critical alerts on managed farms
        if alert_data["type"] == "critical" and farm_obj and farm_obj.agronomist_id:
            agro_user = db.query(User).filter(User.id == farm_obj.agronomist_id).first()
            if agro_user:
                asyncio.create_task(send_alert_email(
                    to_email=agro_user.email,
                    title=f"[{db_plant.crop_name.title()}] {title}",
                    message=alert_data["message"],
                    alert_type=alert_data["type"],
                    crop_name=db_plant.crop_name,
                    farm_name=getattr(farm_obj, "name", ""),
                    action_url="/my-farms",
                ))
                asyncio.create_task(
                    notification_service.broadcast_sse(str(farm_obj.agronomist_id), payload)
                )
    
    db.commit()

    # Send soil test result emails to farmer and managing agronomist (non-blocking)
    from app.services.email_service import send_soil_test_email
    from app.models.farm import Farm as _Farm

    _fertilizer_recs = [
        {"type": r["type"], "quantity_kg": r["total_kg"], "reason": r["reason"]}
        for r in fertilizers
    ]
    _farm = db.query(_Farm).filter(_Farm.id == db_plant.farm_id).first() if db_plant.farm_id else None
    _farm_name = getattr(_farm, "name", "")

    asyncio.create_task(send_soil_test_email(
        to_email=current_user.email,
        full_name=current_user.full_name,
        crop_name=db_plant.crop_name,
        farm_name=_farm_name,
        growth_stage=stage,
        health_score=score,
        health_status=status,
        n=data.n, p=data.p, k=data.k,
        ph=data.ph, moisture=data.moisture, temperature=data.temperature,
        fertilizer_recs=_fertilizer_recs,
        is_agronomist=False,
    ))

    if _farm and _farm.agronomist_id:
        _agro = db.query(User).filter(User.id == _farm.agronomist_id).first()
        if _agro:
            asyncio.create_task(send_soil_test_email(
                to_email=_agro.email,
                full_name=_agro.full_name,
                crop_name=db_plant.crop_name,
                farm_name=_farm_name,
                growth_stage=stage,
                health_score=score,
                health_status=status,
                n=data.n, p=data.p, k=data.k,
                ph=data.ph, moisture=data.moisture, temperature=data.temperature,
                fertilizer_recs=_fertilizer_recs,
                is_agronomist=True,
            ))

    # 7. Return full response (supporting both legacy keys and requested response format keys)
    return {
        # Legacy keys
        "success": True,
        "entry_id": new_entry.id,
        "stage": stage,
        "deficit": deficits,
        "fertilizer": fertilizers,
        
        # Exact response format keys requested by user
        "growth_stage": stage,
        "health_score": score,
        "status": status,
        "nutrient_deficits": deficits,
        "fertilizer_recommendations": [
            {
                "type": r["type"],
                "quantity_kg": r["total_kg"],
                "reason": r["reason"]
            } for r in fertilizers
        ],
        "next_action": "Apply recommended fertilizer within 5 days and retest soil in 10 days."
    }

@router.get("/farm-data")
async def get_farm_data(db: Session = Depends(get_db), current_user: User = Depends(role_required(["agronomist", "admin"]))):
    """Agronomist/Admin only: get aggregated farm data"""
    from app.models.farm import Farm
    return db.query(Farm).all()

@router.put("/planted-crops/{plant_id}/status")
async def update_crop_status(plant_id: UUID, status: str, db: Session = Depends(get_db), current_user: User = Depends(role_required(["farmer", "agronomist", "admin"]))):
    db_plant = db.query(PlantedCrop).filter(PlantedCrop.id == plant_id).first()
    if not db_plant:
        raise HTTPException(status_code=404, detail="Planted crop not found")
    if db_plant.user_id != current_user.id and current_user.role not in ["admin", "agronomist"]:
        raise HTTPException(status_code=403, detail="Not authorized to update status for this crop")
    db_plant.status = status
    db.commit()
    db.refresh(db_plant)
    return {"success": True, "status": db_plant.status}

@router.delete("/planted-crops/{plant_id}")
async def delete_planted_crop(plant_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(role_required(["farmer", "agronomist", "admin"]))):
    db_plant = db.query(PlantedCrop).filter(PlantedCrop.id == plant_id).first()
    if not db_plant:
        raise HTTPException(status_code=404, detail="Planted crop not found")
    if db_plant.user_id != current_user.id and current_user.role not in ["admin", "agronomist"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this crop")
    delete_planted_crop_cascade(db, db_plant)
    db.commit()
    return {"success": True, "message": "Planted crop deleted"}
