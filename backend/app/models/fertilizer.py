import uuid
from sqlalchemy import Column, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class FertilizerPlan(Base):
    __tablename__ = "fertilizer_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("planted_crops.id"))

    nitrogen_deficit = Column(Float, nullable=True)
    phosphorus_deficit = Column(Float, nullable=True)
    potassium_deficit = Column(Float, nullable=True)

    urea_kg = Column(Float, nullable=True)
    dap_kg = Column(Float, nullable=True)
    npk_kg = Column(Float, nullable=True)

    # Granular recommendation columns
    fertilizer_type = Column(String, nullable=True)
    quantity_kg = Column(Float, nullable=True)
    nutrient_target = Column(String, nullable=True)
    explanation = Column(Text, nullable=True)

    generated_by = Column(String) # system, agronomist
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    planted_crop = relationship("PlantedCrop", back_populates="fertilizer_plans")
    overrides = relationship("AgronomistOverride", back_populates="plan")

class AgronomistOverride(Base):
    __tablename__ = "agronomist_overrides"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fertilizer_plan_id = Column(UUID(as_uuid=True), ForeignKey("fertilizer_plans.id"))

    overridden_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    urea_kg = Column(Float)
    dap_kg = Column(Float)
    npk_kg = Column(Float)

    reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plan = relationship("FertilizerPlan", back_populates="overrides")
