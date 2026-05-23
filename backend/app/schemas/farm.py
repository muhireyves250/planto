from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class FarmBase(BaseModel):
    farm_name: str
    location: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    farm_size: Optional[str] = None
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None

class FarmCreate(FarmBase):
    pass

class FarmUpdate(BaseModel):
    farm_name: Optional[str] = None
    location: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    farm_size: Optional[str] = None
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None

class FarmDB(FarmBase):
    id: UUID
    owner_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
