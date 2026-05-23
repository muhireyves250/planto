import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Date, Float, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class PlantedCrop(Base):
    __tablename__ = "planted_crops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    crop_name = Column(String, nullable=False)
    source_prediction_id = Column(UUID(as_uuid=True), ForeignKey("predictions.id"), nullable=True)

    planting_date = Column(Date, nullable=False, server_default=func.current_date())
    expected_harvest_date = Column(Date, nullable=True)

    status = Column(String, default="active") # active, harvested, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    farm = relationship("Farm", back_populates="planted_crops")
    monitoring_data = relationship("SoilMonitoring", back_populates="planted_crop")
    health_history = relationship("CropHealthHistory", back_populates="planted_crop")
    fertilizer_plans = relationship("FertilizerPlan", back_populates="planted_crop")

class CropHealthHistory(Base):
    __tablename__ = "crop_health_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("planted_crops.id"))

    health_score = Column(Float)
    risk_level = Column(String)
    stage = Column(String)

    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    planted_crop = relationship("PlantedCrop", back_populates="health_history")
