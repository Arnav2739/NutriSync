from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone
from app.db.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    
    # Baseline Metrics
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    height_cm = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=False)
    target_weight_kg = Column(Float, nullable=False)
    dietary_preference = Column(String, nullable=False)
    
    # Ambitions & Lifestyle
    primary_goal = Column(String, nullable=True)
    activity_level = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    user = relationship("User", back_populates="profile")


class BiometricLog(Base):
    __tablename__ = "biometric_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    logged_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    weight_kg = Column(Float, nullable=False)
    body_fat_pct = Column(Float, nullable=True)
    waist_cm = Column(Float, nullable=True)
    chest_cm = Column(Float, nullable=True)
    arms_cm = Column(Float, nullable=True)
    notes = Column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="biometric_logs")

