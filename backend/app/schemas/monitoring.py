from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import List, Optional
from uuid import UUID

class MonitoringCreate(BaseModel):
    n: float
    p: float
    k: float
    ph: float
    moisture: float
    temperature: Optional[float] = None
    humidity: Optional[float] = None

class MonitoringDB(MonitoringCreate):
    id: UUID
    plant_id: UUID
    recorded_by: Optional[UUID] = None
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CropHealthHistoryDB(BaseModel):
    id: UUID
    plant_id: UUID
    health_score: float
    risk_level: str
    stage: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FertilizerPlanDB(BaseModel):
    id: UUID
    plant_id: UUID
    nitrogen_deficit: Optional[float] = None
    phosphorus_deficit: Optional[float] = None
    potassium_deficit: Optional[float] = None
    urea_kg: Optional[float] = None
    dap_kg: Optional[float] = None
    npk_kg: Optional[float] = None
    
    # Granular recommendation fields
    fertilizer_type: Optional[str] = None
    quantity_kg: Optional[float] = None
    nutrient_target: Optional[str] = None
    explanation: Optional[str] = None

    generated_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PlantedCropCreate(BaseModel):
    crop_name: str
    farm_id: Optional[UUID] = None
    source_prediction_id: Optional[UUID] = None
    planting_date: date

class PlantedCropDB(PlantedCropCreate):
    id: UUID
    user_id: UUID
    status: str
    created_at: datetime
    monitoring_data: List[MonitoringDB] = []
    health_history: List[CropHealthHistoryDB] = []
    fertilizer_plans: List[FertilizerPlanDB] = []

    model_config = ConfigDict(from_attributes=True)
