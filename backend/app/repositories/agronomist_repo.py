from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func
from uuid import UUID
from typing import List, Optional

from app.models.farm import Farm, ManagedFarmer
from app.models.planted_crop import PlantedCrop, CropHealthHistory
from app.models.soil_monitoring import SoilMonitoring
from app.models.fertilizer import FertilizerPlan
from app.schemas.agronomist import ManagedFarmerCreate, ManagedFarmerUpdate, FarmUpdate


def create_managed_farmer(db: Session, agronomist_id: UUID, data: ManagedFarmerCreate) -> ManagedFarmer:
    farm = Farm(
        agronomist_id=agronomist_id,
        owner_id=None,
        farm_name=data.farm_name,
        farm_size=data.farm_size,
        soil_type=data.soil_type,
        irrigation_type=data.irrigation_type,
        location=data.location,
    )
    db.add(farm)
    db.flush()

    farmer = ManagedFarmer(
        agronomist_id=agronomist_id,
        farm_id=farm.id,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        location=data.location,
        notes=data.notes,
    )
    db.add(farmer)
    db.commit()
    db.refresh(farmer)
    return farmer


def get_managed_farmers(db: Session, agronomist_id: UUID) -> List[ManagedFarmer]:
    return (
        db.query(ManagedFarmer)
        .options(selectinload(ManagedFarmer.farm))
        .filter(ManagedFarmer.agronomist_id == agronomist_id)
        .order_by(ManagedFarmer.created_at.desc())
        .all()
    )


def get_managed_farmer_by_id(db: Session, farmer_id: UUID, agronomist_id: UUID) -> Optional[ManagedFarmer]:
    return (
        db.query(ManagedFarmer)
        .options(selectinload(ManagedFarmer.farm))
        .filter(ManagedFarmer.id == farmer_id, ManagedFarmer.agronomist_id == agronomist_id)
        .first()
    )


def update_managed_farmer(db: Session, farmer_id: UUID, agronomist_id: UUID, data: ManagedFarmerUpdate) -> Optional[ManagedFarmer]:
    farmer = get_managed_farmer_by_id(db, farmer_id, agronomist_id)
    if not farmer:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(farmer, key, value)
    db.commit()
    db.refresh(farmer)
    return farmer


def delete_managed_farmer(db: Session, farmer_id: UUID, agronomist_id: UUID) -> bool:
    farmer = get_managed_farmer_by_id(db, farmer_id, agronomist_id)
    if not farmer:
        return False
    if farmer.farm and farmer.farm.owner_id is None:
        db.delete(farmer.farm)
    db.delete(farmer)
    db.commit()
    return True


def update_managed_farm(db: Session, farm_id: UUID, agronomist_id: UUID, data: FarmUpdate) -> Optional[Farm]:
    farm = (
        db.query(Farm)
        .options(selectinload(Farm.managed_farmer))
        .filter(Farm.id == farm_id, Farm.agronomist_id == agronomist_id)
        .first()
    )
    if not farm:
        return None
    farm_fields = {"farm_name", "farm_size", "location", "soil_type", "irrigation_type"}
    for field in farm_fields:
        val = getattr(data, field, None)
        if val is not None:
            setattr(farm, field, val)
    if farm.managed_farmer:
        if data.farmer_full_name is not None:
            farm.managed_farmer.full_name = data.farmer_full_name
        if data.farmer_email is not None:
            farm.managed_farmer.email = data.farmer_email
        if data.farmer_phone is not None:
            farm.managed_farmer.phone = data.farmer_phone
    db.commit()
    db.refresh(farm)
    return farm


def get_managed_farms(db: Session, agronomist_id: UUID) -> List[Farm]:
    """Farms list with latest health score per crop — single subquery, no N+1."""
    farms = (
        db.query(Farm)
        .options(
            selectinload(Farm.managed_farmer),
            selectinload(Farm.planted_crops),
        )
        .filter(Farm.agronomist_id == agronomist_id)
        .order_by(Farm.created_at.desc())
        .all()
    )

    all_crop_ids = [c.id for f in farms for c in f.planted_crops]
    if not all_crop_ids:
        return farms

    health_subq = (
        db.query(
            CropHealthHistory.plant_id,
            func.max(CropHealthHistory.created_at).label("max_dt"),
        )
        .filter(CropHealthHistory.plant_id.in_(all_crop_ids))
        .group_by(CropHealthHistory.plant_id)
        .subquery()
    )
    latest_healths = (
        db.query(CropHealthHistory)
        .join(
            health_subq,
            (CropHealthHistory.plant_id == health_subq.c.plant_id)
            & (CropHealthHistory.created_at == health_subq.c.max_dt),
        )
        .all()
    )
    health_map = {h.plant_id: h for h in latest_healths}

    for farm in farms:
        for crop in farm.planted_crops:
            crop._latest_health = health_map.get(crop.id)

    return farms


def get_managed_farm_by_id(db: Session, farm_id: UUID, agronomist_id: UUID) -> Optional[Farm]:
    """Farm detail with only the latest entry per relationship — avoids loading
    unbounded monitoring history."""
    farm = (
        db.query(Farm)
        .options(
            selectinload(Farm.managed_farmer),
            selectinload(Farm.planted_crops),
        )
        .filter(Farm.id == farm_id, Farm.agronomist_id == agronomist_id)
        .first()
    )

    if not farm or not farm.planted_crops:
        return farm

    crop_ids = [c.id for c in farm.planted_crops]

    # Latest soil monitoring per crop
    mon_subq = (
        db.query(
            SoilMonitoring.plant_id,
            func.max(SoilMonitoring.recorded_at).label("max_dt"),
        )
        .filter(SoilMonitoring.plant_id.in_(crop_ids))
        .group_by(SoilMonitoring.plant_id)
        .subquery()
    )
    mon_map = {
        m.plant_id: m
        for m in db.query(SoilMonitoring).join(
            mon_subq,
            (SoilMonitoring.plant_id == mon_subq.c.plant_id)
            & (SoilMonitoring.recorded_at == mon_subq.c.max_dt),
        ).all()
    }

    # Latest health entry per crop
    health_subq = (
        db.query(
            CropHealthHistory.plant_id,
            func.max(CropHealthHistory.created_at).label("max_dt"),
        )
        .filter(CropHealthHistory.plant_id.in_(crop_ids))
        .group_by(CropHealthHistory.plant_id)
        .subquery()
    )
    health_map = {
        h.plant_id: h
        for h in db.query(CropHealthHistory).join(
            health_subq,
            (CropHealthHistory.plant_id == health_subq.c.plant_id)
            & (CropHealthHistory.created_at == health_subq.c.max_dt),
        ).all()
    }

    # Latest fertilizer plan per crop
    plan_subq = (
        db.query(
            FertilizerPlan.plant_id,
            func.max(FertilizerPlan.created_at).label("max_dt"),
        )
        .filter(FertilizerPlan.plant_id.in_(crop_ids))
        .group_by(FertilizerPlan.plant_id)
        .subquery()
    )
    plan_map = {
        p.plant_id: p
        for p in db.query(FertilizerPlan).join(
            plan_subq,
            (FertilizerPlan.plant_id == plan_subq.c.plant_id)
            & (FertilizerPlan.created_at == plan_subq.c.max_dt),
        ).all()
    }

    for crop in farm.planted_crops:
        crop._latest_monitoring = mon_map.get(crop.id)
        crop._latest_health = health_map.get(crop.id)
        crop._latest_plan = plan_map.get(crop.id)

    return farm
