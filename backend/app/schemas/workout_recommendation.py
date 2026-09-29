from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID


class RecommendedExerciseItem(BaseModel):
    exercise_id: UUID
    name: str
    primary_muscle: str
    category: str
    equipment: str
    difficulty: str
    target_sets: int
    target_reps: int
    target_reps_label: str
    target_rest_seconds: int
    suggested_weight_kg: float
    coaching_cue: str
    gif_url: Optional[str] = None


class RecommendedRoutineResponse(BaseModel):
    routine_id: str
    routine_title: str
    split_category: str  # "push", "pull", "legs", "full_body", "hiit"
    primary_goal: str
    goal_alignment_badge: str
    estimated_duration_min: int
    estimated_calories_burned: float
    intensity_level: str
    coaching_summary: str
    exercises: List[RecommendedExerciseItem]


class RoutineOptionSummary(BaseModel):
    split_key: str
    title: str
    target_muscles: str
    icon: str
    description: str
