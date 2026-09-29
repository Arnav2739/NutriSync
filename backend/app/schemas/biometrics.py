from pydantic import BaseModel, Field, computed_field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class BiometricLogCreate(BaseModel):
    weight_kg: float = Field(..., gt=20, lt=500, description="Measured body weight in kg")
    body_fat_pct: Optional[float] = Field(default=None, ge=3.0, le=60.0, description="Optional body fat percentage")
    waist_cm: Optional[float] = Field(default=None, ge=30.0, le=250.0, description="Optional waist circumference in cm")
    chest_cm: Optional[float] = Field(default=None, ge=30.0, le=250.0, description="Optional chest circumference in cm")
    arms_cm: Optional[float] = Field(default=None, ge=15.0, le=80.0, description="Optional arms circumference in cm")
    notes: Optional[str] = Field(default=None, max_length=500, description="Optional note (e.g. morning fasted weigh-in)")
    logged_at: Optional[datetime] = Field(default=None, description="Optional custom timestamp")


class BiometricLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    logged_at: datetime
    weight_kg: float
    body_fat_pct: Optional[float] = None
    waist_cm: Optional[float] = None
    chest_cm: Optional[float] = None
    arms_cm: Optional[float] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class BiometricsProgressOverview(BaseModel):
    starting_weight_kg: float
    current_weight_kg: float
    target_weight_kg: float
    weight_delta_kg: float
    to_target_delta_kg: float
    progress_pct: float
    goal_direction: str  # "loss", "gain", "maintenance"
    height_cm: float
    current_bmi: float
    current_bmi_category: str
    total_logs_count: int
    logs: List[BiometricLogResponse]
    trajectory_points: List[dict]
