from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class ManagedFarmerCreate(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    # Farm details (created together with the farmer record)
    farm_name: str
    farm_size: Optional[str] = None
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None


class ManagedFarmerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class ManagedFarmerDB(BaseModel):
    id: UUID
    agronomist_id: UUID
    farm_id: Optional[UUID] = None
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FarmSummary(BaseModel):
    id: UUID
    farm_name: str
    location: Optional[str] = None
    farm_size: Optional[str] = None
    soil_type: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ManagedFarmerWithFarm(ManagedFarmerDB):
    farm: Optional[FarmSummary] = None


class FarmUpdate(BaseModel):
    farm_name: Optional[str] = None
    farm_size: Optional[str] = None
    location: Optional[str] = None
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None
    # Farmer contact fields
    farmer_full_name: Optional[str] = None
    farmer_email: Optional[str] = None
    farmer_phone: Optional[str] = None


class ManagedFarmDetail(BaseModel):
    farm_id: UUID
    farm_name: str
    farm_size: Optional[str] = None
    location: Optional[str] = None
    soil_type: Optional[str] = None
    farmer_name: str
    farmer_phone: Optional[str] = None
    farmer_email: Optional[str] = None
    farmer_location: Optional[str] = None
    active_crops: int
    health_score: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
