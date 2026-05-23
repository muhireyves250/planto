from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import List, Optional

class FertilizerPlanBase(BaseModel):
    nitrogen_deficit: float
    phosphorus_deficit: float
    potassium_deficit: float
    urea_kg: float
    dap_kg: float
    npk_kg: float
    generated_by: str

class FertilizerPlanDB(FertilizerPlanBase):
    id: UUID
    plant_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FertilizerRecommendationResponse(BaseModel):
    stage: str
    deficit: dict
    fertilizer: List[dict]
    health_score: float
    status: str
