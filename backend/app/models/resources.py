import uuid
from sqlalchemy import Column, String, Integer, Boolean, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.database import Base

class Resource(Base):
    __tablename__ = "resources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "desk" or "room"

    floor = Column(Integer, nullable=False)
    zone = Column(String, nullable=True)

    pos_x = Column(Float)  # floor plan position (%)
    pos_y = Column(Float)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)