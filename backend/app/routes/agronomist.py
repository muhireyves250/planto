from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.rbac import role_required
from app.models.user import User
from app.schemas.agronomist import (
    ManagedFarmerCreate,
    ManagedFarmerUpdate,
    ManagedFarmerDB,
    ManagedFarmerWithFarm,
    FarmUpdate,
)
from app.repositories import agronomist_repo

router = APIRouter(prefix="/agronomist", tags=["Agronomist"])

# ── Managed Farmers ──────────────────────────────────────────────────────────

@router.post("/farmers", response_model=ManagedFarmerDB, status_code=201)
async def register_managed_farmer(
    data: ManagedFarmerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["agronomist", "admin"])),
):
    """
    Register a farmer who does not have a platform account.
    A farm is automatically created and linked to this agronomist.
    """
    farmer = agronomist_repo.create_managed_farmer(db, current_user.id, data)
    return farmer


@router.get("/farmers", response_model=List[ManagedFarmerWithFarm])
async def list_managed_farmers(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["agronomist", "admin"])),
):
    """Return all farmers managed by this agronomist."""
    return agronomist_repo.get_managed_farmers(db, current_user.id)


@router.get("/farmers/{farmer_id}", response_model=ManagedFarmerWithFarm)
async def get_managed_farmer(
    farmer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["agronomist", "admin"])),
):
    farmer = agronomist_repo.get_managed_farmer_by_id(db, farmer_id, current_user.id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Managed farmer not found")
    return farmer


@router.patch("/farmers/{farmer_id}", response_model=ManagedFarmerDB)
async def update_managed_farmer(
    farmer_id: UUID,
    data: ManagedFarmerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["agronomist", "admin"])),
):
    farmer = agronomist_repo.update_managed_farmer(db, farmer_id, current_user.id, data)
    if not farmer:
        raise HTTPException(status_code=404, detail="Managed farmer not found")
    return farmer


@router.delete("/farmers/{farmer_id}", status_code=204)
async def delete_managed_farmer(
    farmer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["agronomist", "admin"])),
):
    deleted = agronomist_repo.delete_managed_farmer(db, farmer_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Managed farmer not found")


# ── Managed Farms ─────────────────────────────────────────────────────────────

@router.get("/farms")
async def list_managed_farms(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["agronomist", "admin"])),
):
    """
    Return all farms managed by this agronomist with summary data
    (farmer name, active crops count, latest health score).
    """
    farms = agronomist_repo.get_managed_farms(db, current_user.id)
    result = []
    for farm in farms:
        active_crops = [c for c in (farm.planted_crops or []) if c.status == "active"]
        latest_health = None
        for crop in active_crops:
            h = getattr(crop, "_latest_health", None)
            if h and (latest_health is None or h.health_score > latest_health):
                latest_health = h.health_score

        result.append({
            "farm_id": str(farm.id),
            "farm_name": farm.farm_name,
            "farm_size": farm.farm_size,
            "location": farm.location,
            "soil_type": farm.soil_type,
            "irrigation_type": farm.irrigation_type,
            "created_at": farm.created_at,
            "farmer_id": str(farm.managed_farmer.id) if farm.managed_farmer else None,
            "farmer_name": farm.managed_farmer.full_name if farm.managed_farmer else None,
            "farmer_phone": farm.managed_farmer.phone if farm.managed_farmer else None,
            "farmer_email": farm.managed_farmer.email if farm.managed_farmer else None,
            "active_crops": len(active_crops),
            "health_score": latest_health,
        })
    return result


@router.get("/farms/{farm_id}")
async def get_managed_farm_detail(
    farm_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["agronomist", "admin"])),
):
    """Full farm detail including all crops, soil data, and fertilizer plans."""
    farm = agronomist_repo.get_managed_farm_by_id(db, farm_id, current_user.id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found or not under your management")

    crops = []
    for crop in (farm.planted_crops or []):
        latest_monitoring = getattr(crop, "_latest_monitoring", None)
        latest_health = getattr(crop, "_latest_health", None)
        latest_plan = getattr(crop, "_latest_plan", None)

        crops.append({
            "id": str(crop.id),
            "crop_name": crop.crop_name,
            "status": crop.status,
            "planting_date": crop.planting_date,
            "health_score": latest_health.health_score if latest_health else None,
            "risk_level": latest_health.risk_level if latest_health else None,
            "latest_soil": {
                "nitrogen": latest_monitoring.nitrogen,
                "phosphorus": latest_monitoring.phosphorus,
                "potassium": latest_monitoring.potassium,
                "ph": latest_monitoring.ph,
                "moisture": latest_monitoring.moisture,
                "recorded_at": latest_monitoring.recorded_at,
            } if latest_monitoring else None,
            "fertilizer_plan": {
                "type": latest_plan.fertilizer_type,
                "quantity_kg": latest_plan.quantity_kg,
                "explanation": latest_plan.explanation,
            } if latest_plan else None,
        })

    return {
        "farm_id": str(farm.id),
        "farm_name": farm.farm_name,
        "farm_size": farm.farm_size,
        "location": farm.location,
        "soil_type": farm.soil_type,
        "irrigation_type": farm.irrigation_type,
        "farmer": {
            "id": str(farm.managed_farmer.id),
            "full_name": farm.managed_farmer.full_name,
            "email": farm.managed_farmer.email,
            "phone": farm.managed_farmer.phone,
            "location": farm.managed_farmer.location,
            "notes": farm.managed_farmer.notes,
        } if farm.managed_farmer else None,
        "crops": crops,
    }


@router.patch("/farms/{farm_id}")
async def update_managed_farm(
    farm_id: UUID,
    data: FarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["agronomist", "admin"])),
):
    """Update farm details and/or farmer contact info."""
    updated = agronomist_repo.update_managed_farm(db, farm_id, current_user.id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Farm not found or not under your management")
    return {"ok": True}
