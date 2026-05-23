from sqlalchemy.orm import Session
from uuid import UUID
from app.models.farm import Farm
from app.schemas.farm import FarmCreate, FarmUpdate

def create_farm(db: Session, owner_id: UUID, farm: FarmCreate):
    db_farm = Farm(
        owner_id=owner_id,
        **farm.model_dump()
    )
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm

def get_farms_by_owner(db: Session, owner_id: UUID):
    return db.query(Farm).filter(Farm.owner_id == owner_id).all()

def get_farm_by_id(db: Session, farm_id: UUID):
    return db.query(Farm).filter(Farm.id == farm_id).first()

def update_farm(db: Session, farm_id: UUID, farm_data: FarmUpdate):
    db_farm = get_farm_by_id(db, farm_id)
    if not db_farm:
        return None
    
    update_data = farm_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_farm, key, value)
        
    db.commit()
    db.refresh(db_farm)
    return db_farm

def delete_farm(db: Session, farm_id: UUID):
    db_farm = get_farm_by_id(db, farm_id)
    if db_farm:
        db.delete(db_farm)
        db.commit()
        return True
    return False
