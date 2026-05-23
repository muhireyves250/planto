from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional
from uuid import UUID

class SoilFeatures(BaseModel):
    n: float
    p: float
    k: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

class PredictionCreate(SoilFeatures):
    user_id: Optional[UUID] = None
    farm_id: Optional[UUID] = None
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
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
