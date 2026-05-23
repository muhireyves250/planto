import uuid
from sqlalchemy import Column, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class SoilMonitoring(Base):
    __tablename__ = "soil_monitoring"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("planted_crops.id"))
    recorded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    nitrogen = Column(Float, nullable=False)
    phosphorus = Column(Float, nullable=False)
    potassium = Column(Float, nullable=False)
    ph = Column(Float, nullable=False)
    moisture = Column(Float, nullable=False)
    temperature = Column(Float)
    humidity = Column(Float)

    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    planted_crop = relationship("PlantedCrop", back_populates="monitoring_data")

    @property
    def n(self): return self.nitrogen
    @property
    def p(self): return self.phosphorus
    @property
    def k(self): return self.potassium
