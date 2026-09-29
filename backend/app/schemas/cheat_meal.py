from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class CheatMealTemplate(BaseModel):
    name: str
    category: str
    calories: float
    protein_g: float
    carbs_g: float
    fats_g: float
    icon: str
    description: str


class AdaptiveRebalancePlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    cheat_meal_log_id: Optional[UUID] = None
    meal_name: str
    surplus_calories: float
    rebalance_days: int
    strategy: str  # "balanced", "step_cardio", "diet_buffer"
    daily_calorie_offset: float
    daily_extra_steps: int
    daily_extra_active_burn_kcal: float
    target_date_start: date
    target_date_end: date
    status: str
    explanation: Optional[str] = None
    glycogen_tip: Optional[str] = None
    created_at: datetime


class CheatMealCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    meal_type: str = Field(default="Dinner")  # Lunch, Dinner, Snack, Late Night, Feast
    estimated_calories: float = Field(..., gt=0)
    protein_g: Optional[float] = Field(default=0.0, ge=0)
    carbs_g: Optional[float] = Field(default=0.0, ge=0)
    fats_g: Optional[float] = Field(default=0.0, ge=0)
    notes: Optional[str] = None
    feeling_tag: Optional[str] = Field(default="Worth it 😋")
    # Rebalance configuration options
    rebalance_days: int = Field(default=3, ge=1, le=7)
    rebalance_strategy: str = Field(default="balanced")  # "balanced", "step_cardio", "diet_buffer"


class CheatMealResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    meal_type: str
    estimated_calories: float
    protein_g: float
    carbs_g: float
    fats_g: float
    consumed_at: datetime
    notes: Optional[str] = None
    feeling_tag: Optional[str] = None
    created_at: datetime
    active_plan: Optional[AdaptiveRebalancePlanResponse] = None


class CheatMealStatsOverview(BaseModel):
    total_logged_all_time: int
    logged_this_month: int
    avg_calories_per_meal: float
    current_active_plan: Optional[AdaptiveRebalancePlanResponse] = None
    recent_meals: List[CheatMealResponse] = []
