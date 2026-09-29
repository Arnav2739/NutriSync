"""
NutriSync Personalized Workout Recommendation Service (Proposal §6.2)
Clinically generates personalized daily workout routines based on athlete biometrics,
primary fitness goal (Hypertrophy, Fat Loss, Strength, Endurance), and active training split.
"""
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.workout import Exercise, WorkoutLog
from app.models.profile import UserProfile
from app.schemas.workout_recommendation import (
    RecommendedRoutineResponse,
    RecommendedExerciseItem,
    RoutineOptionSummary,
)


SPLIT_TEMPLATES: Dict[str, Dict] = {
    "push": {
        "title": "Push Protocol: Chest, Delts & Triceps",
        "icon": "💥",
        "target_muscles": "Chest, Front/Side Deltoids, Triceps",
        "description": "High-tension pressing patterns targeting the entire anterior upper chain.",
        "exercise_names": [
            "Barbell Bench Press",
            "Incline Dumbbell Press",
            "Overhead Barbell Press (OHP)",
            "Dumbbell Lateral Raise",
            "Triceps Rope Pushdown",
        ],
        "weight_multipliers": {
            "Barbell Bench Press": 0.65,
            "Incline Dumbbell Press": 0.25,
            "Overhead Barbell Press (OHP)": 0.40,
            "Dumbbell Lateral Raise": 0.10,
            "Triceps Rope Pushdown": 0.30,
        },
        "cues": {
            "Barbell Bench Press": "Drive through the floor with arched upper back and retracted scaps.",
            "Incline Dumbbell Press": "3-second controlled descent to maximize upper pectoral stretch.",
            "Overhead Barbell Press (OHP)": "Brace glutes and core; press head through at the top lockout.",
            "Dumbbell Lateral Raise": "Lead with elbows; pause 1-second at parallel for peak side-delt cap.",
            "Triceps Rope Pushdown": "Flare the rope at the bottom lockout to fully contract lateral head.",
        },
    },
    "pull": {
        "title": "Pull Protocol: Lat Width, Traps & Biceps",
        "icon": "⚡",
        "target_muscles": "Back, Posterior Delts, Traps, Biceps",
        "description": "Posterior chain loading focusing on vertical and horizontal pulling power.",
        "exercise_names": [
            "Conventional Barbell Deadlift",
            "Barbell Bent-Over Row",
            "Lat Pulldown",
            "Dumbbell Face Pull",
            "Barbell Bicep Curl",
        ],
        "weight_multipliers": {
            "Conventional Barbell Deadlift": 0.85,
            "Barbell Bent-Over Row": 0.55,
            "Lat Pulldown": 0.50,
            "Dumbbell Face Pull": 0.12,
            "Barbell Bicep Curl": 0.20,
        },
        "cues": {
            "Conventional Barbell Deadlift": "Pull slack out of the barbell before leg drive; maintain neutral cervical spine.",
            "Barbell Bent-Over Row": "Pull with elbows tucked at 45 degrees towards the lower ribcage.",
            "Lat Pulldown": "Drive elbows down and back into back pockets; avoid excessive torso swing.",
            "Dumbbell Face Pull": "External shoulder rotation at peak; squeeze rhomboids and rear delts.",
            "Barbell Bicep Curl": "Keep upper arms pinned to torso; eliminate hip momentum.",
        },
    },
    "legs": {
        "title": "Legs & Posterior Chain: Quad & Glute Power",
        "icon": "🦵",
        "target_muscles": "Quads, Hamstrings, Glutes, Calves, Core",
        "description": "Lower body strength and hypertrophy foundation utilizing heavy axial and machine loads.",
        "exercise_names": [
            "Barbell Back Squat",
            "Leg Press",
            "Romanian Deadlift (RDL)",
            "Lying Leg Curl",
            "Hanging Knee Raise",
        ],
        "weight_multipliers": {
            "Barbell Back Squat": 0.80,
            "Leg Press": 1.40,
            "Romanian Deadlift (RDL)": 0.65,
            "Lying Leg Curl": 0.35,
            "Hanging Knee Raise": 0.0,
        },
        "cues": {
            "Barbell Back Squat": "Hit parallel depth with knees tracking toes; maintain braced intra-abdominal pressure.",
            "Leg Press": "Control the sled down without letting lower back peel off the back pad.",
            "Romanian Deadlift (RDL)": "Push hips back as far as possible until intense hamstring stretch is reached.",
            "Lying Leg Curl": "Point toes forward and hold peak contraction for 1 second.",
            "Hanging Knee Raise": "Posterior pelvic tilt at the top; curl hips into chest rather than swinging legs.",
        },
    },
    "full_body": {
        "title": "Full Body Athletic Surge",
        "icon": "🔥",
        "target_muscles": "Full Kinetic Chain (Push, Pull, Legs, Core)",
        "description": "High-efficiency compound workout targeting all major muscle groups in a single session.",
        "exercise_names": [
            "Barbell Back Squat",
            "Barbell Bench Press",
            "Lat Pulldown",
            "Overhead Barbell Press (OHP)",
            "Plank",
        ],
        "weight_multipliers": {
            "Barbell Back Squat": 0.75,
            "Barbell Bench Press": 0.60,
            "Lat Pulldown": 0.50,
            "Overhead Barbell Press (OHP)": 0.35,
            "Plank": 0.0,
        },
        "cues": {
            "Barbell Back Squat": "Explosive concentric ascent; maintain upright thoracic spine.",
            "Barbell Bench Press": "Keep shoulders retracted; tuck elbows on the eccentric phase.",
            "Lat Pulldown": "Full overhead stretch followed by forceful contraction to clavicle.",
            "Overhead Barbell Press (OHP)": "Firm base; do not hyper-extend lumbar spine.",
            "Plank": "Tuck pelvis and squeeze glutes and quads; active tension over passive hanging.",
        },
    },
    "metabolic_hiit": {
        "title": "Metabolic Conditioning & Core Blitz",
        "icon": "⚡",
        "target_muscles": "Cardiovascular, Core, Full Body Endurance",
        "description": "High-density conditioning session maximizing caloric burn and post-exercise oxygen consumption.",
        "exercise_names": [
            "Kettlebell Swing",
            "Burpees",
            "Goblet Squat",
            "Push-Up",
            "Cable Woodchopper",
        ],
        "weight_multipliers": {
            "Kettlebell Swing": 0.20,
            "Burpees": 0.0,
            "Goblet Squat": 0.25,
            "Push-Up": 0.0,
            "Cable Woodchopper": 0.15,
        },
        "cues": {
            "Kettlebell Swing": "Snap hips violently; arms are simply ropes guiding the bell.",
            "Burpees": "Fast chest-to-ground rebound with explosive vertical jump.",
            "Goblet Squat": "Elbows track inside knees; keep torso vertical throughout.",
            "Push-Up": "Full depth; maintain plank integrity without hip sag.",
            "Cable Woodchopper": "Pivot on rear foot and engage obliques throughout the diagonal sweep.",
        },
    },
}


def get_available_splits() -> List[RoutineOptionSummary]:
    """Return available routine split options for athlete selection."""
    return [
        RoutineOptionSummary(
            split_key=key,
            title=data["title"],
            target_muscles=data["target_muscles"],
            icon=data["icon"],
            description=data["description"],
        )
        for key, data in SPLIT_TEMPLATES.items()
    ]


def determine_auto_split(user_id, db: Session) -> str:
    """
    Intelligently select today's split based on user's recent workout history.
    Rotates through Push -> Pull -> Legs -> Full Body.
    """
    last_workout = (
        db.query(WorkoutLog)
        .filter(WorkoutLog.user_id == user_id, WorkoutLog.status == "completed")
        .order_by(WorkoutLog.completed_at.desc())
        .first()
    )

    if not last_workout or not last_workout.routine_tag:
        return "push"

    tag = last_workout.routine_tag.lower()
    if "push" in tag:
        return "pull"
    elif "pull" in tag:
        return "legs"
    elif "leg" in tag:
        return "full_body"
    elif "full" in tag:
        return "metabolic_hiit"
    else:
        return "push"


def generate_recommended_routine(
    split_key: Optional[str],
    user_id,
    profile: Optional[UserProfile],
    db: Session,
) -> RecommendedRoutineResponse:
    """
    Generate an optimal routine calibrated for the athlete's biometrics and goal.
    """
    # 1. Determine split
    if not split_key or split_key == "auto" or split_key not in SPLIT_TEMPLATES:
        split_key = determine_auto_split(user_id, db)

    split_data = SPLIT_TEMPLATES[split_key]
    user_weight = float(profile.weight_kg) if profile and profile.weight_kg else 70.0
    primary_goal = (profile.primary_goal or "Muscle Hypertrophy") if profile else "Muscle Hypertrophy"

    # 2. Configure goal-specific parameters
    goal_lower = primary_goal.lower()
    if "strength" in goal_lower:
        compound_sets = 4
        accessory_sets = 3
        target_reps = 5
        reps_label = "4-6 reps (Strength/Power)"
        rest_sec = 150
        intensity = "High Mechanical Tension"
        goal_badge = "⚡ Heavy Strength & Power Protocol"
        est_duration = 55
        est_cals = round(user_weight * 5.8, 1)
        summary = "Focus on maximal force production with long rest intervals for complete ATP replenishment."
    elif "lose" in goal_lower or "fat" in goal_lower:
        compound_sets = 3
        accessory_sets = 3
        target_reps = 14
        reps_label = "12-15 reps (Metabolic Burn)"
        rest_sec = 60
        intensity = "High Metabolic Conditioning"
        goal_badge = "🔥 Accelerated Fat Loss & Density"
        est_duration = 45
        est_cals = round(user_weight * 6.5, 1)
        summary = "Short rest intervals and high volume to keep heart rate elevated and maximize EPOC caloric expenditure."
    elif "endurance" in goal_lower:
        compound_sets = 3
        accessory_sets = 3
        target_reps = 16
        reps_label = "15-20 reps (Muscular Endurance)"
        rest_sec = 45
        intensity = "Endurance & Work Capacity"
        goal_badge = "🌿 Athletic Endurance Blueprint"
        est_duration = 40
        est_cals = round(user_weight * 6.0, 1)
        summary = "High density and sustained muscular work capacity with minimal cardiovascular drop."
    else:  # Hypertrophy / Default
        compound_sets = 4
        accessory_sets = 3
        target_reps = 10
        reps_label = "8-12 reps (Hypertrophy Zone)"
        rest_sec = 90
        intensity = "Moderate-High Hypertrophic"
        goal_badge = "⚖️ Clinical Muscle Hypertrophy Protocol"
        est_duration = 50
        est_cals = round(user_weight * 5.5, 1)
        summary = "Optimal mechanical tension and metabolic stress balance for targeted myofibrillar hypertrophy."

    # 3. Query exercises from master catalog
    target_names = split_data["exercise_names"]
    exercises_in_db = (
        db.query(Exercise)
        .filter(Exercise.name.in_(target_names))
        .all()
    )
    # Map by name for ordered retrieval
    db_ex_map = {ex.name: ex for ex in exercises_in_db}

    # 4. Construct recommended exercise list
    recommended_items: List[RecommendedExerciseItem] = []
    multipliers = split_data["weight_multipliers"]
    cues = split_data["cues"]

    for idx, ex_name in enumerate(target_names):
        ex = db_ex_map.get(ex_name)
        if not ex:
            continue

        # Distinguish compound (first 2) from isolation/accessory (remaining)
        sets = compound_sets if idx < 2 else accessory_sets

        # Calculate suggested starting weight rounded to 2.5kg increments
        mult = multipliers.get(ex_name, 0.5)
        raw_weight = user_weight * mult
        suggested_weight = round(raw_weight / 2.5) * 2.5 if mult > 0 else 0.0

        recommended_items.append(
            RecommendedExerciseItem(
                exercise_id=ex.id,
                name=ex.name,
                primary_muscle=ex.primary_muscle,
                category=ex.category,
                equipment=ex.equipment.value if hasattr(ex.equipment, "value") else str(ex.equipment),
                difficulty=ex.difficulty.value if hasattr(ex.difficulty, "value") else str(ex.difficulty),
                target_sets=sets,
                target_reps=target_reps,
                target_reps_label=reps_label,
                target_rest_seconds=rest_sec,
                suggested_weight_kg=suggested_weight,
                coaching_cue=cues.get(ex_name, "Execute with strict form and full range of motion."),
                gif_url=ex.gif_url,
            )
        )

    return RecommendedRoutineResponse(
        routine_id=f"rec_{split_key}_{int(user_weight)}",
        routine_title=split_data["title"],
        split_category=split_key,
        primary_goal=primary_goal,
        goal_alignment_badge=goal_badge,
        estimated_duration_min=est_duration,
        estimated_calories_burned=est_cals,
        intensity_level=intensity,
        coaching_summary=summary,
        exercises=recommended_items,
    )
