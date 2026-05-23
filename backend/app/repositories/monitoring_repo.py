from sqlalchemy.orm import Session
from uuid import UUID
from app.models.planted_crop import PlantedCrop
from app.models.soil_monitoring import SoilMonitoring
from app.schemas.monitoring import MonitoringCreate

def create_planted_crop(db: Session, user_id: UUID, crop_name: str, status: str = "pending"):
    db_crop = PlantedCrop(user_id=user_id, crop_name=crop_name, status=status)
    db.add(db_crop)
    db.commit()
    db.refresh(db_crop)
    return db_crop

def get_planted_crops_by_user(db: Session, user_id: UUID):
    return db.query(PlantedCrop).filter(PlantedCrop.user_id == user_id).all()

def get_all_planted_crops(db: Session):
    return db.query(PlantedCrop).all()

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
        humidity=data.humidity
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def get_latest_monitoring(db: Session, plant_id: UUID):
    return db.query(SoilMonitoring).filter(SoilMonitoring.plant_id == plant_id).order_by(SoilMonitoring.recorded_at.desc()).first()

def get_monitoring_history(db: Session, plant_id: UUID, limit: int = 10):
    return db.query(SoilMonitoring).filter(SoilMonitoring.plant_id == plant_id).order_by(SoilMonitoring.recorded_at.desc()).limit(limit).all()
