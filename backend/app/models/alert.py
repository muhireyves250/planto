import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    plant_id = Column(UUID(as_uuid=True), ForeignKey("planted_crops.id"), nullable=True)

    type = Column(String)          # info | warning | critical
    category = Column(String, nullable=True)  # soil | crop | system | farm
    title = Column(String, nullable=True)
    message = Column(Text)
    action_url = Column(String, nullable=True)  # e.g. "/monitoring"
    is_read = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    planted_crop = relationship("PlantedCrop")
