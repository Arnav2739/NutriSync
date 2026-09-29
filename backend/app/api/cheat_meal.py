from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import get_db
from app.models.user import User
from app.models.profile import UserProfile
from app.models.cheat_meal import CheatMealLog, AdaptiveRebalancePlan
from app.core.security import get_current_user
from app.schemas.cheat_meal import (
    CheatMealTemplate,
    CheatMealCreate,
    CheatMealResponse,
    AdaptiveRebalancePlanResponse,
    CheatMealStatsOverview,
)
from app.services.adaptive_balancer import POPULAR_CHEAT_TEMPLATES, compute_adaptive_rebalance

router = APIRouter(prefix="/cheat-meals", tags=["Cheat Meals & Adaptive Balancer"])


@router.get("/templates", response_model=List[CheatMealTemplate])
def get_popular_cheat_templates(current_user: User = Depends(get_current_user)):
    """Returns curated popular cheat meal food templates with accurate calories and macros."""
    return POPULAR_CHEAT_TEMPLATES


@router.get("/overview", response_model=CheatMealStatsOverview)
def get_cheat_meal_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns overall summary statistics and the active adaptive rebalance plan."""
    meals = (
        db.query(CheatMealLog)
        .filter(CheatMealLog.user_id == current_user.id)
        .order_by(desc(CheatMealLog.consumed_at))
        .all()
    )

    total_count = len(meals)
    now = datetime.utcnow()
    this_month_count = sum(1 for m in meals if m.consumed_at.year == now.year and m.consumed_at.month == now.month)
    avg_cals = round(sum(m.estimated_calories for m in meals) / total_count, 1) if total_count > 0 else 0.0

    # Find currently active plan
    active_plan = (
        db.query(AdaptiveRebalancePlan)
        .filter(
            AdaptiveRebalancePlan.user_id == current_user.id,
            AdaptiveRebalancePlan.status == "active"
        )
        .order_by(desc(AdaptiveRebalancePlan.created_at))
        .first()
    )

    recent_pydantic = [CheatMealResponse.model_validate(m) for m in meals[:5]]

    return CheatMealStatsOverview(
        total_logged_all_time=total_count,
        logged_this_month=this_month_count,
        avg_calories_per_meal=avg_cals,
        current_active_plan=AdaptiveRebalancePlanResponse.model_validate(active_plan) if active_plan else None,
        recent_meals=recent_pydantic,
    )


@router.get("", response_model=List[CheatMealResponse])
def get_cheat_meals_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all cheat meals logged by the athlete."""
    meals = (
        db.query(CheatMealLog)
        .filter(CheatMealLog.user_id == current_user.id)
        .order_by(desc(CheatMealLog.consumed_at))
        .all()
    )
    return meals


@router.post("", response_model=CheatMealResponse, status_code=status.HTTP_201_CREATED)
def log_cheat_meal(
    payload: CheatMealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Logs an indulgence meal and computes a non-punitive adaptive rebalancing plan (Proposal §6.6 & §6.7).
    """
    # 1. Fetch user profile for clinical Mifflin-St Jeor calibration
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(
            user_id=current_user.id,
            weight_kg=72.0,
            height_cm=175.0,
            age=25,
            gender="Male",
            activity_level="Moderately Active",
            primary_goal="Build strength",
        )

    # 2. Persist the Cheat Meal Log
    cheat_log = CheatMealLog(
        user_id=current_user.id,
        name=payload.name,
        meal_type=payload.meal_type,
        estimated_calories=payload.estimated_calories,
        protein_g=payload.protein_g or 0.0,
        carbs_g=payload.carbs_g or 0.0,
        fats_g=payload.fats_g or 0.0,
        notes=payload.notes,
        feeling_tag=payload.feeling_tag,
    )
    db.add(cheat_log)
    db.flush()

    # 3. Dismiss any older active plans to keep single current focus
    db.query(AdaptiveRebalancePlan).filter(
        AdaptiveRebalancePlan.user_id == current_user.id,
        AdaptiveRebalancePlan.status == "active"
    ).update({"status": "completed"})

    # 4. Generate the new adaptive rebalance plan
    rebalance_data = compute_adaptive_rebalance(
        profile=profile,
        estimated_calories=payload.estimated_calories,
        rebalance_days=payload.rebalance_days,
        strategy=payload.rebalance_strategy,
    )

    plan = AdaptiveRebalancePlan(
        user_id=current_user.id,
        cheat_meal_log_id=cheat_log.id,
        meal_name=payload.name,
        surplus_calories=rebalance_data["surplus_calories"],
        rebalance_days=rebalance_data["rebalance_days"],
        strategy=rebalance_data["strategy"],
        daily_calorie_offset=rebalance_data["daily_calorie_offset"],
        daily_extra_steps=rebalance_data["daily_extra_steps"],
        daily_extra_active_burn_kcal=rebalance_data["daily_extra_active_burn_kcal"],
        target_date_start=rebalance_data["target_date_start"],
        target_date_end=rebalance_data["target_date_end"],
        status="active",
        explanation=rebalance_data["explanation"],
        glycogen_tip=rebalance_data["glycogen_tip"],
    )
    db.add(plan)
    db.commit()
    db.refresh(cheat_log)

    resp = CheatMealResponse.model_validate(cheat_log)
    resp.active_plan = AdaptiveRebalancePlanResponse.model_validate(plan)
    return resp


@router.get("/active-plan", response_model=Optional[AdaptiveRebalancePlanResponse])
def get_active_rebalance_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns the current active rebalancing plan for the athlete."""
    plan = (
        db.query(AdaptiveRebalancePlan)
        .filter(
            AdaptiveRebalancePlan.user_id == current_user.id,
            AdaptiveRebalancePlan.status == "active"
        )
        .order_by(desc(AdaptiveRebalancePlan.created_at))
        .first()
    )
    return plan


@router.post("/active-plan/{plan_id}/complete")
def complete_active_rebalance_plan(
    plan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marks the active rebalancing plan as completed."""
    plan = (
        db.query(AdaptiveRebalancePlan)
        .filter(
            AdaptiveRebalancePlan.id == plan_id,
            AdaptiveRebalancePlan.user_id == current_user.id
        )
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Rebalance plan not found.")

    plan.status = "completed"
    db.commit()
    return {"message": "Adaptive rebalance plan completed successfully!"}


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cheat_meal(
    meal_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a cheat meal log and any associated rebalance plans."""
    meal = (
        db.query(CheatMealLog)
        .filter(
            CheatMealLog.id == meal_id,
            CheatMealLog.user_id == current_user.id
        )
        .first()
    )
    if not meal:
        raise HTTPException(status_code=404, detail="Cheat meal log not found.")

    db.delete(meal)
    db.commit()
    return None
