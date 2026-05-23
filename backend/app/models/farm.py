import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Farm(Base):
    __tablename__ = "farms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    farm_name = Column(String, nullable=False)
    location = Column(String) # String address
    location_lat = Column(Float)
    location_lng = Column(Float)
    farm_size = Column(String) # e.g. "5 hectares"
    soil_type = Column(String)
    irrigation_type = Column(String) # e.g. "drip", "sprinkler"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="farms")
    members = relationship("FarmMember", back_populates="farm")
    predictions = relationship("Prediction", back_populates="farm")
    planted_crops = relationship("PlantedCrop", back_populates="farm")

class FarmMember(Base):
    __tablename__ = "farm_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    role_in_farm = Column(String) # owner, farmer, advisor
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farm = relationship("Farm", back_populates="members")
    user = relationship("User")
