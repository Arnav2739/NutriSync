from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime


# --- Pantry Item Schemas ---
class PantryItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    category: str = Field(default="Other", max_length=80)
    quantity: float = Field(default=1.0, ge=0.01)
    unit: str = Field(default="pcs", max_length=30)
    calories: float = Field(default=0.0, ge=0.0)
    protein_g: float = Field(default=0.0, ge=0.0)
    carbs_g: float = Field(default=0.0, ge=0.0)
    fats_g: float = Field(default=0.0, ge=0.0)


class PantryItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    quantity: float = Field(default=1.0, ge=0.01)
    unit: Optional[str] = None
    category: Optional[str] = None
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fats_g: Optional[float] = None


class PantryItemUpdate(BaseModel):
    quantity: Optional[float] = Field(default=None, ge=0.0)
    unit: Optional[str] = None


class PantryItemResponse(PantryItemBase):
    id: UUID
    user_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PantryBulkAdd(BaseModel):
    items: List[PantryItemCreate]


# --- Master Catalog Schemas ---
class GroceryCatalogItem(BaseModel):
    name: str
    category: str
    default_unit: str
    serving_size: float
    calories: float
    protein_g: float
    carbs_g: float
    fats_g: float
    is_pantry_staple: bool = True
    tags: List[str] = []


# --- Nutritional Deficiency Schemas  ---
class DeficiencyDetail(BaseModel):
    nutrient: str
    status: str  # "Severely Deficient", "Moderate Shortage", "Optimal", "Surplus"
    daily_requirement: float
    available_daily_est: float
    daily_gap: float
    unit: str
    message: str


class SuggestedAddition(BaseModel):
    name: str
    category: str
    reason: str
    suggested_qty: float
    unit: str
    impact_protein_g: float = 0.0
    impact_calories: float = 0.0


class NutritionalDeficiencyResponse(BaseModel):
    daily_target_calories: float
    daily_target_protein_g: float
    daily_target_carbs_g: float
    daily_target_fats_g: float
    total_pantry_calories: float
    total_pantry_protein_g: float
    total_pantry_carbs_g: float
    total_pantry_fats_g: float
    estimated_pantry_days: float
    deficiencies: List[DeficiencyDetail]
    suggested_additions: List[SuggestedAddition]
    overall_health_score: int  # 0 to 100


# --- Meal Plan Generation Schemas  ---
class PlannedMeal(BaseModel):
    meal_type: str  # breakfast, lunch, dinner, snack
    recipe_id: str
    title: str
    ingredient_summary: str
    instructions: str
    prep_time_min: int
    calories: float
    protein_g: float
    carbs_g: float
    fats_g: float
    tags: List[str] = []
    pantry_coverage_percent: float = 100.0


class GeneratedMealPlanResponse(BaseModel):
    title: str
    target_calories: float
    target_protein_g: float
    target_carbs_g: float
    target_fats_g: float
    plan_total_calories: float
    plan_total_protein_g: float
    plan_total_carbs_g: float
    plan_total_fats_g: float
    meals: List[PlannedMeal]
    available_ingredients_used: List[str]
    missing_ingredients_to_unlock_more: List[str]
    message: str


# --- Smart Shopping List Schemas  ---
class ShoppingListItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    category: str = Field(default="Other", max_length=80)
    quantity: float = Field(default=1.0, ge=0.01)
    unit: str = Field(default="pcs", max_length=30)
    reason: Optional[str] = None


class ShoppingListItemResponse(BaseModel):
    id: UUID
    name: str
    category: str
    quantity: float
    unit: str
    is_purchased: bool
    reason: Optional[str]
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class BulkShoppingListAdd(BaseModel):
    items: List[ShoppingListItemCreate]
