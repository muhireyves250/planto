import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Farm(Base):
    __tablename__ = "farms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    agronomist_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    farm_name = Column(String, nullable=False)
    location = Column(String)
    location_lat = Column(Float)
    location_lng = Column(Float)
    farm_size = Column(String)
    soil_type = Column(String)
    irrigation_type = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", foreign_keys=[owner_id], back_populates="farms")
    agronomist = relationship("User", foreign_keys=[agronomist_id], back_populates="managed_farms")
    members = relationship("FarmMember", back_populates="farm")
    predictions = relationship("Prediction", back_populates="farm")
    planted_crops = relationship("PlantedCrop", back_populates="farm")
    managed_farmer = relationship("ManagedFarmer", back_populates="farm", uselist=False)


class ManagedFarmer(Base):
    """
    A farmer who does not have a platform account.
    Created by an agronomist to track farms on their behalf.
    """
    __tablename__ = "managed_farmers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agronomist_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id"), nullable=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    agronomist = relationship("User", foreign_keys=[agronomist_id], back_populates="managed_farmers")
    farm = relationship("Farm", back_populates="managed_farmer")


class FarmMember(Base):
    __tablename__ = "farm_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    role_in_farm = Column(String) # owner, farmer, advisor
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farm = relationship("Farm", back_populates="members")
    user = relationship("User")
