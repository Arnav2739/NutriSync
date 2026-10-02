import math
from datetime import date, timedelta
from typing import Dict, Any, List
from app.models.profile import UserProfile
from app.schemas.cheat_meal import CheatMealTemplate


POPULAR_CHEAT_TEMPLATES: List[CheatMealTemplate] = [
  CheatMealTemplate(
    name="Cheeseburger & French Fries",
    category="Fast Food",
    calories=1150.0,
    protein_g=42.0,
    carbs_g=105.0,
    fats_g=58.0,
    icon="🍔",
    description="Double beef patty with melted cheese, sesame bun, and golden fries."
  ),
  CheatMealTemplate(
    name="Pepperoni Pizza (3 Large Slices)",
    category="Italian",
    calories=920.0,
    protein_g=36.0,
    carbs_g=94.0,
    fats_g=44.0,
    icon="🍕",
    description="Stone-baked hand-tossed crust with rich tomato sauce, mozzarella, and pepperoni."
  ),
  CheatMealTemplate(
    name="Chicken Dum Biryani (Full Bowl)",
    category="South Asian",
    calories=880.0,
    protein_g=38.0,
    carbs_g=112.0,
    fats_g=32.0,
    icon="🍛",
    description="Slow-cooked spiced basmati rice layered with tender marinated chicken."
  ),
  CheatMealTemplate(
    name="Loaded Beef & Cheese Nachos",
    category="Mexican",
    calories=960.0,
    protein_g=26.0,
    carbs_g=84.0,
    fats_g=58.0,
    icon="🧀",
    description="Tortilla chips smothered in melted queso, seasoned ground beef, and salsa."
  ),
  CheatMealTemplate(
    name="Pad Thai with Chicken & Peanuts",
    category="Asian",
    calories=790.0,
    protein_g=32.0,
    carbs_g=95.0,
    fats_g=28.0,
    icon="🍜",
    description="Wok-tossed flat rice noodles with egg, bean sprouts, chicken, and crushed peanuts."
  ),
  CheatMealTemplate(
    name="Crispy Fried Chicken Tenders & Fries",
    category="Comfort Food",
    calories=890.0,
    protein_g=44.0,
    carbs_g=82.0,
    fats_g=46.0,
    icon="🍗",
    description="Southern-style buttermilk breaded tenders served with seasoned fries and sauce."
  ),
  CheatMealTemplate(
    name="Chocolate Lava Cake & Ice Cream",
    category="Dessert",
    calories=680.0,
    protein_g=9.0,
    carbs_g=88.0,
    fats_g=36.0,
    icon="🍰",
    description="Warm molten chocolate fudge center paired with cold vanilla bean ice cream."
  ),
  CheatMealTemplate(
    name="Glazed Cinnamon Rolls (2 pcs)",
    category="Bakery",
    calories=620.0,
    protein_g=8.0,
    carbs_g=92.0,
    fats_g=24.0,
    icon="🥐",
    description="Pillowy soft cinnamon pastry drenched in warm sweet cream cheese glaze."
  ),
  CheatMealTemplate(
    name="Belgian Waffles with Nutella & Banana",
    category="Dessert",
    calories=740.0,
    protein_g=14.0,
    carbs_g=96.0,
    fats_g=34.0,
    icon="🧇",
    description="Thick golden malted waffles layered with rich hazelnut spread and sliced bananas."
  ),
  CheatMealTemplate(
    name="Sushi Deluxe Combo (12 pcs)",
    category="Japanese",
    calories=720.0,
    protein_g=30.0,
    carbs_g=108.0,
    fats_g=16.0,
    icon="🍣",
    description="Salmon avocado rolls, spicy tuna, and fresh nigiri with pickled ginger."
  ),
]


def calculate_user_daily_targets(profile: UserProfile) -> Dict[str, float]:
    """Computes clinical Mifflin-St Jeor TDEE and per-meal calorie budgets."""
    weight = profile.weight_kg or 70.0
    height = profile.height_cm or 175.0
    age = profile.age or 25
    gender = (profile.gender or "Male").capitalize()

    # BMR via Mifflin-St Jeor
    s = 5 if gender == "Male" else -161 if gender == "Female" else -78
    bmr = 10.0 * weight + 6.25 * height - 5.0 * age + s

    # Activity multiplier
    act_map = {
        "sedentary": 1.2,
        "lightly active": 1.375,
        "moderately active": 1.55,
        "very active": 1.725,
        "extra active": 1.9,
    }
    level = (profile.activity_level or "moderately active").lower()
    tdee = bmr * act_map.get(level, 1.55)

    # Goal offset
    goal = (profile.primary_goal or "").lower()
    target_cals = tdee
    if "lose" in goal or "cut" in goal:
        target_cals -= 400
    elif "build" in goal or "strength" in goal or "gain" in goal:
        target_cals += 250

    target_cals = max(1500.0, target_cals)
    # Typical allocated meal budget (assuming ~3.5 meals/day: Breakfast, Lunch, Dinner, Snack)
    allocated_meal_budget = target_cals / 3.5

    return {
        "bmr": round(bmr, 1),
        "tdee": round(tdee, 1),
        "daily_target_calories": round(target_cals, 1),
        "allocated_meal_budget": round(allocated_meal_budget, 1),
    }


def compute_adaptive_rebalance(
    profile: UserProfile,
    estimated_calories: float,
    rebalance_days: int = 3,
    strategy: str = "balanced"
) -> Dict[str, Any]:
    """
    Computes a non-punitive, multi-day adaptive rebalancing plan .
    Smoothly redistributes excess energy so weekly fat loss / maintenance trajectories remain steady.
    """
    targets = calculate_user_daily_targets(profile)
    meal_budget = targets["allocated_meal_budget"]

    # Compute net surplus (excess over what would normally be eaten at this meal slot)
    net_surplus = max(150.0, estimated_calories - meal_budget)
    days = max(1, min(7, rebalance_days))

    # Safe caps: Maximum dietary reduction per day is 250 kcal (never crash diet)
    daily_cal_offset = 0.0
    daily_extra_steps = 0
    daily_burn_kcal = 0.0

    if strategy == "step_cardio":
        # Strategy B: 100% active expenditure burn, zero food cuts
        daily_burn_kcal = round(net_surplus / days, 1)
        # Average person burns ~0.04 kcal per step
        daily_extra_steps = int(round(daily_burn_kcal / 0.04))
        daily_extra_steps = int(math.ceil(daily_extra_steps / 100.0) * 100)  # Round to nearest 100 steps
        daily_cal_offset = 0.0

    elif strategy == "diet_buffer":
        # Strategy C: 100% modest diet buffer
        raw_cut = net_surplus / days
        daily_cal_offset = -round(min(250.0, raw_cut), 1)
        # If surplus is huge, handle the remainder via light steps
        remaining = net_surplus - (abs(daily_cal_offset) * days)
        if remaining > 0:
            daily_burn_kcal = round(remaining / days, 1)
            daily_extra_steps = int(round(daily_burn_kcal / 0.04))
            daily_extra_steps = int(math.ceil(daily_extra_steps / 100.0) * 100)

    else:
        # Default: "balanced" Hybrid (50% gentle diet buffer, 50% steps NEAT)
        half_surplus = net_surplus * 0.5
        daily_cal_offset = -round(min(150.0, half_surplus / days), 1)
        diet_covered = abs(daily_cal_offset) * days
        remaining_burn = net_surplus - diet_covered

        daily_burn_kcal = round(remaining_burn / days, 1)
        daily_extra_steps = int(round(daily_burn_kcal / 0.04))
        daily_extra_steps = int(math.ceil(daily_extra_steps / 100.0) * 100)

    start_d = date.today()
    end_d = start_d + timedelta(days=days)

    explanation = (
        f"Enjoyed a {int(estimated_calories)} kcal meal (+{int(net_surplus)} kcal over your standard {int(meal_budget)} kcal meal baseline). "
        f"Rather than punishing yourself with starvation diets, NutriSync distributes this across {days} days: "
    )
    if strategy == "step_cardio":
        explanation += f"Eat 100% normally and add +{daily_extra_steps:,} daily steps (~{int(daily_burn_kcal)} kcal burn) via brisk 25-minute walks."
    elif strategy == "diet_buffer":
        explanation += f"Slightly reduce daily intake by {abs(int(daily_cal_offset))} kcal (e.g. swap a high-calorie snack for fruit or reduce cooking oil)."
    else:
        explanation += (
            f"A light {abs(int(daily_cal_offset))} kcal/day meal buffer combined with an easy +{daily_extra_steps:,} daily steps (~{int(daily_burn_kcal)} kcal) "
            f"completely neutralizes the surplus without hunger."
        )

    glycogen_tip = (
        "💡 Sports Science Glycogen Tip: High-calorie and carb-heavy meals temporarily surge intramuscular glycogen reserves "
        "and water hydration. This makes tomorrow and the next 48 hours the IDEAL window to hit heavy compound personal records (Bench, Squat, Deadlift) "
        "because your muscles are fully loaded with ATP and contractile power!"
    )

    return {
        "surplus_calories": round(net_surplus, 1),
        "rebalance_days": days,
        "strategy": strategy,
        "daily_calorie_offset": daily_cal_offset,
        "daily_extra_steps": daily_extra_steps,
        "daily_extra_active_burn_kcal": daily_burn_kcal,
        "target_date_start": start_d,
        "target_date_end": end_d,
        "status": "active",
        "explanation": explanation,
        "glycogen_tip": glycogen_tip,
    }
