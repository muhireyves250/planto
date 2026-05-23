from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.core.rbac import role_required, get_current_user
from app.models.user import User
from app.schemas import farm as farm_schemas
from app.repositories import farm_repo

router = APIRouter(prefix="/farms", tags=["Farm Management"])

@router.post("/", response_model=farm_schemas.FarmDB)
async def create_new_farm(farm: farm_schemas.FarmCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return farm_repo.create_farm(db=db, owner_id=current_user.id, farm=farm)

@router.get("/", response_model=List[farm_schemas.FarmDB])
async def list_my_farms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return farm_repo.get_farms_by_owner(db=db, owner_id=current_user.id)

@router.get("/{farm_id}", response_model=farm_schemas.FarmDB)
async def get_farm_details(farm_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    farm = farm_repo.get_farm_by_id(db, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this farm")
    return farm

@router.put("/{farm_id}", response_model=farm_schemas.FarmDB)
async def update_farm_info(farm_id: UUID, farm_data: farm_schemas.FarmUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    farm = farm_repo.get_farm_by_id(db, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this farm")
    return farm_repo.update_farm(db, farm_id, farm_data)

@router.delete("/{farm_id}")
async def remove_farm(farm_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    farm = farm_repo.get_farm_by_id(db, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this farm")
    farm_repo.delete_farm(db, farm_id)
    return {"success": True, "message": "Farm deleted successfully"}
