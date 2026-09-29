from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    goal = Column(String, nullable=True)

    # One-to-one relationship with UserProfile
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    # One-to-many relationship with WorkoutLog
    workout_logs = relationship("WorkoutLog", back_populates="user", cascade="all, delete-orphan")

    # Grocery & Diet Relationships
    pantry_items = relationship("PantryItem", back_populates="user", cascade="all, delete-orphan")
    saved_meal_plans = relationship("SavedMealPlan", back_populates="user", cascade="all, delete-orphan")
    shopping_list_items = relationship("ShoppingListItem", back_populates="user", cascade="all, delete-orphan")

    # Biometrics & Progress Tracking
    biometric_logs = relationship("BiometricLog", back_populates="user", cascade="all, delete-orphan")

