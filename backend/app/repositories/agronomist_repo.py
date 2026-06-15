from sqlalchemy.orm import Session, selectinload
from uuid import UUID
from typing import List, Optional

from app.models.farm import Farm, ManagedFarmer
from app.models.planted_crop import PlantedCrop
from app.schemas.agronomist import ManagedFarmerCreate, ManagedFarmerUpdate


def create_managed_farmer(db: Session, agronomist_id: UUID, data: ManagedFarmerCreate) -> ManagedFarmer:
    # Create the farm first
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
    db.flush()  # get farm.id without committing

    farmer = ManagedFarmer(
        agronomist_id=agronomist_id,
        farm_id=farm.id,
        full_name=data.full_name,
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
    # Delete farm if it exists and has no other owner
    if farmer.farm and farmer.farm.owner_id is None:
        db.delete(farmer.farm)
    db.delete(farmer)
    db.commit()
    return True


def get_managed_farms(db: Session, agronomist_id: UUID) -> List[Farm]:
    return (
        db.query(Farm)
        .options(
            selectinload(Farm.managed_farmer),
            selectinload(Farm.planted_crops),
        )
        .filter(Farm.agronomist_id == agronomist_id)
        .order_by(Farm.created_at.desc())
        .all()
    )


def get_managed_farm_by_id(db: Session, farm_id: UUID, agronomist_id: UUID) -> Optional[Farm]:
    return (
        db.query(Farm)
        .options(
            selectinload(Farm.managed_farmer),
            selectinload(Farm.planted_crops).selectinload(PlantedCrop.monitoring_data),
            selectinload(Farm.planted_crops).selectinload(PlantedCrop.health_history),
            selectinload(Farm.planted_crops).selectinload(PlantedCrop.fertilizer_plans),
        )
        .filter(Farm.id == farm_id, Farm.agronomist_id == agronomist_id)
        .first()
    )
