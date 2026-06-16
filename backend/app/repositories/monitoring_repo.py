from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from app.models.planted_crop import PlantedCrop, CropHealthHistory
from app.models.soil_monitoring import SoilMonitoring
from app.models.fertilizer import FertilizerPlan
from app.schemas.monitoring import MonitoringCreate


def create_planted_crop(db: Session, user_id: UUID, crop_name: str, status: str = "pending", farm_id: UUID = None):
    db_crop = PlantedCrop(user_id=user_id, crop_name=crop_name, status=status, farm_id=farm_id)
    db.add(db_crop)
    db.commit()
    db.refresh(db_crop)
    return db_crop


def get_planted_crops_by_user(db: Session, user_id: UUID):
    crops = (
        db.query(PlantedCrop)
        .filter(PlantedCrop.user_id == user_id)
        .order_by(PlantedCrop.created_at.desc())
        .all()
    )
    if not crops:
        return crops

    crop_ids = [c.id for c in crops]

    # Latest soil monitoring per crop
    mon_subq = (
        db.query(SoilMonitoring.plant_id, func.max(SoilMonitoring.recorded_at).label("max_dt"))
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

    # Latest health history per crop
    health_subq = (
        db.query(CropHealthHistory.plant_id, func.max(CropHealthHistory.created_at).label("max_dt"))
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
        db.query(FertilizerPlan.plant_id, func.max(FertilizerPlan.created_at).label("max_dt"))
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

    # Attach only the latest entry per relationship so the schema serialises correctly
    for crop in crops:
        crop.monitoring_data = [mon_map[crop.id]] if crop.id in mon_map else []
        crop.health_history = [health_map[crop.id]] if crop.id in health_map else []
        crop.fertilizer_plans = [plan_map[crop.id]] if crop.id in plan_map else []

    return crops


def get_all_planted_crops(db: Session):
    return db.query(PlantedCrop).order_by(PlantedCrop.created_at.desc()).all()


def get_planted_crop_by_id(db: Session, plant_id: UUID):
    return db.query(PlantedCrop).filter(PlantedCrop.id == plant_id).first()


def create_monitoring_entry(db: Session, plant_id: UUID, data: MonitoringCreate, user_id: UUID = None):
    db_entry = SoilMonitoring(
        plant_id=plant_id,
        recorded_by=user_id,
        nitrogen=data.n,
        phosphorus=data.p,
        potassium=data.k,
        ph=data.ph,
        moisture=data.moisture,
        temperature=data.temperature,
        humidity=data.humidity,
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


def get_latest_monitoring(db: Session, plant_id: UUID):
    return (
        db.query(SoilMonitoring)
        .filter(SoilMonitoring.plant_id == plant_id)
        .order_by(SoilMonitoring.recorded_at.desc())
        .first()
    )


def get_monitoring_history(db: Session, plant_id: UUID, limit: int = 10):
    return (
        db.query(SoilMonitoring)
        .filter(SoilMonitoring.plant_id == plant_id)
        .order_by(SoilMonitoring.recorded_at.desc())
        .limit(limit)
        .all()
    )
