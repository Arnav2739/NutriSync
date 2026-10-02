from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
import uuid

from app.db.database import get_db
from app.models.user import User
from app.models.workout import Exercise, WorkoutLog, WorkoutExerciseLog, EquipmentEnum, DifficultyEnum, SessionStatusEnum
from app.schemas.workout import (
    ExerciseResponse,
    WorkoutLogCreate,
    WorkoutLogUpdate,
    WorkoutLogResponse,
)
from app.schemas.workout_recommendation import (
    RecommendedRoutineResponse,
    RoutineOptionSummary,
)
from app.services.workout_recommender import (
    get_available_splits,
    generate_recommended_routine,
)
from app.core.security import get_current_user

router = APIRouter(tags=["Fitness & Workout Engine"])


# ==========================================================================
# EXERCISE CATALOG ENDPOINTS (Public / Authenticated)
# ==========================================================================

@router.get("/exercises", response_model=List[ExerciseResponse])
def list_exercises(
    primary_muscle: Optional[str] = Query(None, description="Filter by primary muscle (e.g. Chest, Back, Quads)"),
    equipment: Optional[EquipmentEnum] = Query(None, description="Filter by equipment required"),
    category: Optional[str] = Query(None, description="Filter by category (e.g. Strength, Hypertrophy, Cardio)"),
    difficulty: Optional[DifficultyEnum] = Query(None, description="Filter by difficulty tier"),
    q: Optional[str] = Query(None, description="Search keyword in exercise name"),
    db: Session = Depends(get_db),
):
    """
    Retrieve the master catalog of exercises with optional muscle, equipment, and category filtering.
    """
    query = db.query(Exercise)

    if primary_muscle:
        query = query.filter(Exercise.primary_muscle.ilike(f"%{primary_muscle}%"))
    if equipment:
        query = query.filter(Exercise.equipment == equipment)
    if category:
        query = query.filter(Exercise.category.ilike(f"%{category}%"))
    if difficulty:
        query = query.filter(Exercise.difficulty == difficulty)
    if q:
        query = query.filter(Exercise.name.ilike(f"%{q}%"))

    return query.order_by(Exercise.primary_muscle, Exercise.name).all()


@router.get("/exercises/{exercise_id}", response_model=ExerciseResponse)
def get_exercise_detail(
    exercise_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Retrieve single exercise detail and instructions by ID.
    """
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )
    return exercise


# ==========================================================================
# USER WORKOUT LOGGING & SESSION ENDPOINTS (JWT Protected)
# ==========================================================================

@router.post("/workouts", response_model=WorkoutLogResponse, status_code=status.HTTP_201_CREATED)
def create_workout_log(
    workout_in: WorkoutLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Record a completed or in-progress workout session with exercise logs and sets.
    """
    started_at = workout_in.started_at or datetime.now(timezone.utc)
    completed_at = workout_in.completed_at

    # Auto-calculate total volume (kg) from sets if not provided
    calculated_volume = 0.0
    for ex_log in workout_in.exercise_logs:
        for s in ex_log.sets_data:
            if s.completed:
                calculated_volume += s.reps * s.weight_kg

    total_volume = workout_in.total_volume_kg or calculated_volume

    # Auto-calculate calories burned if not explicitly supplied
    calculated_calories = float(workout_in.calories_burned or 0.0)
    if calculated_calories <= 0.0:
        duration_min = 45.0
        if started_at and completed_at:
            delta_sec = (completed_at - started_at).total_seconds()
            if delta_sec > 60:
                duration_min = delta_sec / 60.0

        user_weight = (
            current_user.profile.weight_kg
            if (current_user.profile and current_user.profile.weight_kg)
            else 70.0
        )
        weight_factor = user_weight / 70.0
        base_metabolic = duration_min * 5.5 * weight_factor
        mechanical_tonnage = total_volume * 0.04
        calculated_calories = round(max(35.0, base_metabolic + mechanical_tonnage), 1)

    # Create root WorkoutLog session
    workout_log = WorkoutLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        title=workout_in.title,
        routine_tag=workout_in.routine_tag,
        started_at=started_at,
        completed_at=completed_at,
        total_volume_kg=total_volume,
        calories_burned=calculated_calories,
        notes=workout_in.notes,
        status=workout_in.status,
    )
    db.add(workout_log)
    db.flush()

    # Add child WorkoutExerciseLogs
    for idx, ex_in in enumerate(workout_in.exercise_logs, start=1):
        # Validate exercise exists
        exercise = db.query(Exercise).filter(Exercise.id == ex_in.exercise_id).first()
        if not exercise:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Exercise ID {ex_in.exercise_id} does not exist in master catalog.",
            )

        sets_dicts = [s.model_dump() for s in ex_in.sets_data]
        ex_log = WorkoutExerciseLog(
            id=uuid.uuid4(),
            workout_log_id=workout_log.id,
            exercise_id=ex_in.exercise_id,
            order_index=ex_in.order_index or idx,
            sets_data=sets_dicts,
            target_rest_seconds=ex_in.target_rest_seconds,
        )
        db.add(ex_log)

    db.commit()

    # Query with eager loading for clean response
    result = (
        db.query(WorkoutLog)
        .options(
            joinedload(WorkoutLog.exercise_logs).joinedload(WorkoutExerciseLog.exercise)
        )
        .filter(WorkoutLog.id == workout_log.id)
        .first()
    )
    return result


@router.get("/workouts", response_model=List[WorkoutLogResponse])
def list_user_workouts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve all workout sessions for the authenticated user, ordered by started_at descending.
    """
    workouts = (
        db.query(WorkoutLog)
        .options(
            joinedload(WorkoutLog.exercise_logs).joinedload(WorkoutExerciseLog.exercise)
        )
        .filter(WorkoutLog.user_id == current_user.id)
        .order_by(WorkoutLog.started_at.desc())
        .all()
    )
    return workouts


# ══════════════════════════════════════════════════════════════════════════════
# PERSONALIZED WORKOUT RECOMMENDATION ENGINE 
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/workouts/recommendations/splits", response_model=List[RoutineOptionSummary])
def list_recommendation_splits():
    """
    Retrieve available training splits supported by the recommendation engine.
    """
    return get_available_splits()


@router.get("/workouts/recommendations", response_model=RecommendedRoutineResponse)
def get_personalized_recommendation(
    split: Optional[str] = Query("auto", description="Target split (push, pull, legs, full_body, metabolic_hiit, auto)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a personalized workout routine calibrated for the user's primary goal,
    biometrics, and training split.
    """
    return generate_recommended_routine(
        split_key=split,
        user_id=current_user.id,
        profile=current_user.profile,
        db=db,
    )


@router.get("/workouts/{workout_id}", response_model=WorkoutLogResponse)
def get_workout_log(
    workout_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve a specific workout session belonging to the authenticated user.
    """
    workout = (
        db.query(WorkoutLog)
        .options(
            joinedload(WorkoutLog.exercise_logs).joinedload(WorkoutExerciseLog.exercise)
        )
        .filter(WorkoutLog.id == workout_id, WorkoutLog.user_id == current_user.id)
        .first()
    )
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout log not found.",
        )
    return workout


@router.delete("/workouts/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout_log(
    workout_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a workout session and cascade delete its exercise logs.
    """
    workout = (
        db.query(WorkoutLog)
        .filter(WorkoutLog.id == workout_id, WorkoutLog.user_id == current_user.id)
        .first()
    )
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout log not found.",
        )
    db.delete(workout)
    db.commit()
    return None


