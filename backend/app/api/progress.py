from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
from datetime import datetime, timezone
import uuid

from app.db.database import get_db
from app.models.workout import WorkoutLog
from app.models.user import User
from app.models.profile import UserProfile, BiometricLog
from app.schemas.biometrics import (
    BiometricLogCreate,
    BiometricLogResponse,
    BiometricsProgressOverview,
)
from app.core.security import get_current_user

router = APIRouter(prefix="/progress", tags=["Progress Tracking"])


@router.get("/stats")
def get_progress_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Aggregated progress data for charting:
    - Workout volume per session (over time)
    - Workout count per week
    - Calories burned per session (with automatic metabolic backfill if 0)
    """
    workouts = (
        db.query(WorkoutLog)
        .filter(WorkoutLog.user_id == current_user.id, WorkoutLog.status == "completed")
        .order_by(WorkoutLog.started_at.asc())
        .all()
    )

    # User body weight for metabolic calculation (default 70kg baseline)
    user_weight = (
        current_user.profile.weight_kg
        if (current_user.profile and current_user.profile.weight_kg)
        else 70.0
    )
    weight_factor = user_weight / 70.0

    volume_over_time = []
    calories_over_time = []
    workout_dates = []
    needs_commit = False

    for w in workouts:
        date_str = w.started_at.strftime("%b %d") if w.started_at else "N/A"
        vol = round(w.total_volume_kg or 0.0, 1)

        # Caloric expenditure: backfill if recorded as 0
        cals = float(w.calories_burned or 0.0)
        if cals <= 0.0:
            # Estimate based on duration and tonnage
            duration_min = 45.0  # default reasonable session duration
            if w.started_at and w.completed_at:
                delta_sec = (w.completed_at - w.started_at).total_seconds()
                if delta_sec > 60:
                    duration_min = delta_sec / 60.0
            
            base_metabolic = duration_min * 5.5 * weight_factor
            mechanical_tonnage = vol * 0.04
            cals = round(max(35.0, base_metabolic + mechanical_tonnage), 1)

            # Persist backfill to database
            w.calories_burned = cals
            db.add(w)
            needs_commit = True

        volume_over_time.append({
            "date": date_str,
            "volume": vol,
            "title": w.title,
        })
        calories_over_time.append({
            "date": date_str,
            "calories": round(cals, 1),
            "title": w.title,
        })
        workout_dates.append(date_str)

    if needs_commit:
        db.commit()

    # Weekly frequency: count workouts per ISO week
    weekly_query = (
        db.query(
            func.to_char(WorkoutLog.started_at, 'IYYY-IW').label("week"),
            func.count(WorkoutLog.id).label("count"),
            func.sum(WorkoutLog.total_volume_kg).label("total_volume"),
        )
        .filter(WorkoutLog.user_id == current_user.id, WorkoutLog.status == "completed")
        .group_by(func.to_char(WorkoutLog.started_at, 'IYYY-IW'))
        .order_by(func.to_char(WorkoutLog.started_at, 'IYYY-IW').asc())
        .all()
    )

    weekly_stats = []
    for row in weekly_query:
        weekly_stats.append({
            "week": row.week,
            "workouts": row.count,
            "volume": round(float(row.total_volume or 0), 1),
        })

    # Summary stats
    total_workouts = len(workouts)
    total_volume = round(sum(w.total_volume_kg or 0 for w in workouts), 1)
    total_calories = round(sum(w.calories_burned or 0 for w in workouts), 1)
    avg_volume = round(total_volume / total_workouts, 1) if total_workouts > 0 else 0

    return {
        "summary": {
            "total_workouts": total_workouts,
            "total_volume_kg": total_volume,
            "total_calories_burned": total_calories,
            "avg_volume_per_session": avg_volume,
        },
        "volume_over_time": volume_over_time,
        "calories_over_time": calories_over_time,
        "weekly_stats": weekly_stats,
    }


# ══════════════════════════════════════════════════════════════════════════════
# BIOMETRICS & WEIGHT TRAJECTORY TRACKING
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/biometrics", response_model=BiometricsProgressOverview)
def get_biometrics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve user weight history, progress towards goal, and BMI trajectory.
    """
    profile = current_user.profile
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Biometric profile not calibrated yet. Complete onboarding first.",
        )

    logs = (
        db.query(BiometricLog)
        .filter(BiometricLog.user_id == current_user.id)
        .order_by(BiometricLog.logged_at.asc())
        .all()
    )

    target_weight = round(float(profile.target_weight_kg), 1)
    height_cm = float(profile.height_cm)
    height_m = height_cm / 100.0

    if logs:
        starting_weight = round(float(logs[0].weight_kg), 1)
        current_weight = round(float(logs[-1].weight_kg), 1)
    else:
        starting_weight = round(float(profile.weight_kg), 1)
        current_weight = starting_weight

    # Determine goal direction
    if target_weight < starting_weight:
        goal_direction = "loss"
    elif target_weight > starting_weight:
        goal_direction = "gain"
    else:
        goal_direction = "maintenance"

    weight_delta = round(current_weight - starting_weight, 1)
    to_target_delta = round(current_weight - target_weight, 1)

    # Compute progress %
    if goal_direction == "loss":
        total_to_lose = starting_weight - target_weight
        lost = starting_weight - current_weight
        progress_pct = max(0.0, min(100.0, round((lost / total_to_lose) * 100.0, 1))) if total_to_lose > 0 else 100.0
    elif goal_direction == "gain":
        total_to_gain = target_weight - starting_weight
        gained = current_weight - starting_weight
        progress_pct = max(0.0, min(100.0, round((gained / total_to_gain) * 100.0, 1))) if total_to_gain > 0 else 100.0
    else:
        progress_pct = 100.0 if abs(to_target_delta) <= 0.5 else 50.0

    # BMI
    current_bmi = round(current_weight / (height_m * height_m), 1)
    if current_bmi < 18.5:
        bmi_cat = "Underweight"
    elif current_bmi < 25.0:
        bmi_cat = "Normal weight"
    elif current_bmi < 30.0:
        bmi_cat = "Overweight"
    else:
        bmi_cat = "Obese"

    # Trajectory chart points
    trajectory_points = []
    if logs:
        for log in logs:
            trajectory_points.append({
                "date": log.logged_at.strftime("%b %d") if log.logged_at else "N/A",
                "weight": round(float(log.weight_kg), 1),
                "target": target_weight,
            })
    else:
        created_date = profile.created_at.strftime("%b %d") if profile.created_at else "Start"
        trajectory_points.append({
            "date": created_date,
            "weight": starting_weight,
            "target": target_weight,
        })

    return BiometricsProgressOverview(
        starting_weight_kg=starting_weight,
        current_weight_kg=current_weight,
        target_weight_kg=target_weight,
        weight_delta_kg=weight_delta,
        to_target_delta_kg=to_target_delta,
        progress_pct=progress_pct,
        goal_direction=goal_direction,
        height_cm=height_cm,
        current_bmi=current_bmi,
        current_bmi_category=bmi_cat,
        total_logs_count=len(logs),
        logs=logs,
        trajectory_points=trajectory_points,
    )


@router.post("/biometrics", response_model=BiometricLogResponse, status_code=status.HTTP_201_CREATED)
def log_biometric_entry(
    entry_in: BiometricLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Log a new body weight and measurement entry.
    Automatically updates the user's active profile weight so all metabolic equations sync.
    """
    logged_at = entry_in.logged_at or datetime.now(timezone.utc)

    # 1. Create biometric log
    new_log = BiometricLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        logged_at=logged_at,
        weight_kg=round(entry_in.weight_kg, 1),
        body_fat_pct=entry_in.body_fat_pct,
        waist_cm=entry_in.waist_cm,
        chest_cm=entry_in.chest_cm,
        arms_cm=entry_in.arms_cm,
        notes=entry_in.notes,
    )
    db.add(new_log)

    # 2. Synchronize active profile weight
    profile = current_user.profile
    if profile:
        profile.weight_kg = round(entry_in.weight_kg, 1)
        db.add(profile)

    db.commit()
    db.refresh(new_log)
    return new_log


@router.delete("/biometrics/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_biometric_entry(
    log_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a specific biometric entry.
    """
    log = (
        db.query(BiometricLog)
        .filter(BiometricLog.id == log_id, BiometricLog.user_id == current_user.id)
        .first()
    )
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Biometric entry not found.",
        )
    db.delete(log)
    db.commit()
    return None
