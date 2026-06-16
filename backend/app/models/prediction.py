import uuid
from sqlalchemy import Column, Float, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id"))

    n = Column(Float, nullable=False)
    p = Column(Float, nullable=False)
    k = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=True)   # legacy — kept for old rows
    ph = Column(Float, nullable=False)
    rainfall = Column(Float, nullable=True)   # legacy — kept for old rows
    ec = Column(Float, nullable=True)
    moisture = Column(Float, nullable=True)
    
    predicted_crop = Column(String, index=True, nullable=False)
    confidence = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    farm = relationship("Farm", back_populates="predictions")
