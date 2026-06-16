from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional
from uuid import UUID

class SoilFeatures(BaseModel):
    n: float
    p: float
    k: float
    temperature: float
    ec: float
    ph: float
    moisture: float

class PredictionCreate(SoilFeatures):
    user_id: Optional[UUID] = None
    farm_id: Optional[UUID] = None
    predicted_crop: str
    confidence: float
    # legacy fields — optional so old and new clients both work
    humidity: Optional[float] = None
    rainfall: Optional[float] = None

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
    # legacy rows may have NULL ec/moisture — override required fields from SoilFeatures
    ec: Optional[float] = None
    moisture: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
