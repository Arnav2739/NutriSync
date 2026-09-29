from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.database import Base


class PantryItem(Base):
    __tablename__ = "pantry_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, default="Other")  # Protein, Grains & Carbs, Vegetables, Dairy, Fats & Oils, Fruits, Other
    quantity = Column(Float, nullable=False, default=1.0)
    unit = Column(String, nullable=False, default="pcs")        # g, ml, pcs, slices, scoops, tbsp
    calories = Column(Float, nullable=False, default=0.0)
    protein_g = Column(Float, nullable=False, default=0.0)
    carbs_g = Column(Float, nullable=False, default=0.0)
    fats_g = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="pantry_items")


class SavedMealPlan(Base):
    __tablename__ = "saved_meal_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False, default="Pantry Fuel Plan")
    total_calories = Column(Float, nullable=False, default=0.0)
    total_protein_g = Column(Float, nullable=False, default=0.0)
    total_carbs_g = Column(Float, nullable=False, default=0.0)
    total_fats_g = Column(Float, nullable=False, default=0.0)
    meals = Column(JSONB, nullable=False, default=list)  # list of meal objects
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="saved_meal_plans")


class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False, default="Other")
    quantity = Column(Float, nullable=False, default=1.0)
    unit = Column(String, nullable=False, default="pcs")
    is_purchased = Column(Boolean, nullable=False, default=False)
    reason = Column(String, nullable=True)  # e.g., "Protein Deficiency (+50g/day)" or "Recipe Ingredient"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="shopping_list_items")
