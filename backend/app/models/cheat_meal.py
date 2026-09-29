import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base


class CheatMealLog(Base):
    """
    Cheat Meal Tracker (Project Proposal §6.6).
    Captures off-plan / indulgence meals, estimated energy/macro load, and emotional context.
    """
    __tablename__ = "cheat_meal_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    meal_type = Column(String(50), default="Dinner", nullable=False)  # Lunch, Dinner, Snack, Late Night, Feast
    estimated_calories = Column(Float, nullable=False, default=800.0)
    protein_g = Column(Float, default=0.0, nullable=False)
    carbs_g = Column(Float, default=0.0, nullable=False)
    fats_g = Column(Float, default=0.0, nullable=False)
    consumed_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
    feeling_tag = Column(String(100), nullable=True)  # e.g. "Worth it 😋", "Social event 🥂", "Cravings satisfied 🍕"
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", backref="cheat_meal_logs")
    rebalance_plans = relationship("AdaptiveRebalancePlan", back_populates="cheat_meal_log", cascade="all, delete-orphan")


class AdaptiveRebalancePlan(Base):
    """
    Adaptive Caloric & Expenditure Balancer (Project Proposal §6.7).
    Calculates a non-punitive multi-day caloric and step compensation strategy
    so weekly fat loss or maintenance trajectories are preserved without severe dieting.
    """
    __tablename__ = "adaptive_rebalance_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    cheat_meal_log_id = Column(UUID(as_uuid=True), ForeignKey("cheat_meal_logs.id", ondelete="SET NULL"), nullable=True)
    meal_name = Column(String(150), default="Indulgence Meal", nullable=False)
    surplus_calories = Column(Float, default=0.0, nullable=False)  # Net surplus beyond normal meal budget
    rebalance_days = Column(Integer, default=3, nullable=False)  # 2, 3, or 4 days
    strategy = Column(String(50), default="balanced", nullable=False)  # "balanced", "step_cardio", "diet_buffer"
    daily_calorie_offset = Column(Float, default=0.0, nullable=False)  # e.g. -120 kcal/day (safe reduction)
    daily_extra_steps = Column(Integer, default=0, nullable=False)  # e.g. +2,000 steps/day (~80-100 kcal)
    daily_extra_active_burn_kcal = Column(Float, default=0.0, nullable=False)  # e.g. 100 kcal via brisk walking
    target_date_start = Column(Date, default=date.today, nullable=False)
    target_date_end = Column(Date, default=date.today, nullable=False)
    status = Column(String(50), default="active", nullable=False)  # "active", "completed", "dismissed"
    explanation = Column(Text, nullable=True)  # Motivational sports science rationale
    glycogen_tip = Column(Text, nullable=True)  # How to leverage extra carbs for lifting PRs
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", backref="adaptive_rebalance_plans")
    cheat_meal_log = relationship("CheatMealLog", back_populates="rebalance_plans")
