import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("planted_crops.id"))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    type = Column(String) # fertilizer, irrigation, disease, soil
    title = Column(String)
    description = Column(Text)
    severity = Column(String) # low, medium, high
    is_ai_generated = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    planted_crop = relationship("PlantedCrop")
    creator = relationship("User")
