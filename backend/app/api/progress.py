from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.workout import WorkoutLog
from app.models.user import User
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