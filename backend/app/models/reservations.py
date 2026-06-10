import uuid
from sqlalchemy import Column, Date, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.database import Base

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    resource_id = Column(UUID(as_uuid=True), ForeignKey("resources.id"), nullable=False)

    booking_date = Column(Date, nullable=False)

    status = Column(String, default="active")  # active / cancelled / removed

    created_at = Column(DateTime, default=datetime.utcnow)


    __table_args__ = (
        UniqueConstraint("resource_id", "booking_date", name="uq_resource_per_day"),
    )