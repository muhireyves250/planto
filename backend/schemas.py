from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List

class SoilFeatures(BaseModel):
    n: float
    p: float
    k: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

class PredictionCreate(SoilFeatures):
    predicted_crop: str
    confidence: float

class PredictionResponse(BaseModel):
    success: bool
    crop: str
    confidence: float
    advice: List[str]
    status: str

    model_config = ConfigDict(from_attributes=True)

class PredictionDB(PredictionCreate):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

# User Schemas
class UserBase(BaseModel):
    email: str
    full_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserSettingsUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    farm_name: str | None = None
    primary_phone: str | None = None
    default_soil_type: str | None = None
    irrigation_system: str | None = None
    farm_location: str | None = None
    notify_email: bool | None = None
    notify_push: bool | None = None
    notify_sms: bool | None = None

class UserDB(UserBase):
    id: int
    created_at: datetime
    farm_name: str | None = None
    primary_phone: str | None = None
    default_soil_type: str | None = None
    irrigation_system: str | None = None
    farm_location: str | None = None
    notify_email: bool | None = None
    notify_push: bool | None = None
    notify_sms: bool | None = None

    model_config = ConfigDict(from_attributes=True)

