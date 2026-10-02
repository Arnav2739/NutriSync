import re
from typing import List, Dict, Any, Optional, Tuple
from app.models.grocery import PantryItem
from app.models.profile import UserProfile
from app.db.grocery_catalog import MASTER_GROCERY_CATALOG, MASTER_RECIPE_CATALOG
from app.schemas.grocery import (
    NutritionalDeficiencyResponse,
    DeficiencyDetail,
    SuggestedAddition,
    GeneratedMealPlanResponse,
    PlannedMeal,
)


def _normalize(text: str) -> str:
    """Normalize ingredient text for robust substring and token matching."""
    text = text.lower()
    text = re.sub(r'[\(\)\/\,\.\-]', ' ', text)
    return " ".join(text.split())


def find_catalog_match(item_name: str) -> Optional[Dict[str, Any]]:
    """Match a user item name against the master grocery catalog."""
    norm_query = _normalize(item_name)
    
    # 1. Exact or normalized exact match
    for cat_item in MASTER_GROCERY_CATALOG:
        norm_cat = _normalize(cat_item["name"])
        if norm_query == norm_cat:
            return cat_item
            
    # 2. Substring matching (e.g. "eggs" in "fresh eggs", "chicken" in "chicken breast")
    for cat_item in MASTER_GROCERY_CATALOG:
        norm_cat = _normalize(cat_item["name"])
        if norm_query in norm_cat or norm_cat in norm_query:
            return cat_item

    # 3. Token overlap
    query_tokens = set(norm_query.split())
    best_match = None
    best_overlap = 0
    for cat_item in MASTER_GROCERY_CATALOG:
        cat_tokens = set(_normalize(cat_item["name"]).split())
        overlap = len(query_tokens.intersection(cat_tokens))
        if overlap > best_overlap:
            best_overlap = overlap
            best_match = cat_item

    if best_overlap > 0:
        return best_match

    return None


def calculate_item_nutrition(
    name: str, 
    quantity: float, 
    unit: Optional[str] = None,
    category: Optional[str] = None
) -> Tuple[float, float, float, float, str, str]:
    """
    Computes total calories, protein, carbs, fats, unit, and category
    based on quantity and master catalog densities.
    """
    catalog_item = find_catalog_match(name)
    
    if not catalog_item:
        # Default fallback values for uncatalogued items
        final_unit = unit or "pcs"
        final_cat = category or "Other"
        return 0.0, 0.0, 0.0, 0.0, final_unit, final_cat

    final_unit = unit or catalog_item["default_unit"]
    final_cat = category or catalog_item["category"]
    serving = catalog_item["serving_size"]
    
    ratio = max(0.01, quantity / serving)
    calories = round(catalog_item["calories"] * ratio, 1)
    protein_g = round(catalog_item["protein_g"] * ratio, 1)
    carbs_g = round(catalog_item["carbs_g"] * ratio, 1)
    fats_g = round(catalog_item["fats_g"] * ratio, 1)
    
    return calories, protein_g, carbs_g, fats_g, final_unit, final_cat


def calculate_athlete_targets(profile: Optional[UserProfile]) -> Dict[str, float]:
    """Calculate clinical daily nutritional targets using Mifflin-St Jeor equation."""
    if not profile or not profile.weight_kg or not profile.height_cm or not profile.age:
        return {
            "calories": 2200.0,
            "protein_g": 140.0,
            "carbs_g": 250.0,
            "fats_g": 65.0,
        }

    weight = profile.weight_kg
    height = profile.height_cm
    age = profile.age
    gender = (profile.gender or "male").lower()

    # 1. BMR via Mifflin-St Jeor
    if "fem" in gender:
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    else:
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5

    # 2. Activity Multiplier
    activity = (profile.activity_level or "").lower()
    if "sedentary" in activity:
        multiplier = 1.2
    elif "light" in activity:
        multiplier = 1.375
    elif "moderat" in activity:
        multiplier = 1.55
    elif "very" in activity or "hard" in activity:
        multiplier = 1.725
    elif "extra" in activity or "athlet" in activity:
        multiplier = 1.9
    else:
        multiplier = 1.55

    tdee = bmr * multiplier

    # 3. Goal Adjustment
    goal = (profile.primary_goal or "").lower()
    if "muscle" in goal or "hypertrophy" in goal or "bulk" in goal:
        target_calories = tdee + 250.0
    elif "loss" in goal or "cut" in goal or "lean" in goal:
        target_calories = max(1300.0, tdee - 450.0)
    else:
        target_calories = tdee

    # 4. Clinical Macro Partitioning
    # Protein: 2.0g per kg of bodyweight
    protein_g = round(weight * 2.0, 1)
    
    # Healthy Fats: 25% of total caloric intake (9 kcal/g)
    fats_g = round((target_calories * 0.25) / 9.0, 1)
    
    # Remainder to Carbohydrates (4 kcal/g)
    allocated_kcal = (protein_g * 4.0) + (fats_g * 9.0)
    carbs_g = round(max(50.0, (target_calories - allocated_kcal) / 4.0), 1)

    return {
        "calories": round(target_calories, 0),
        "protein_g": protein_g,
        "carbs_g": carbs_g,
        "fats_g": fats_g,
    }


def detect_nutritional_deficiencies(
    pantry_items: List[PantryItem], 
    profile: Optional[UserProfile]
) -> NutritionalDeficiencyResponse:
    """
    Compares the total available groceries in the user's pantry against
    their calibrated sports science requirements .
    """
    targets = calculate_athlete_targets(profile)
    
    total_pantry_cal = sum(item.calories for item in pantry_items)
    total_pantry_protein = sum(item.protein_g for item in pantry_items)
    total_pantry_carbs = sum(item.carbs_g for item in pantry_items)
    total_pantry_fats = sum(item.fats_g for item in pantry_items)

    # Estimate pantry duration (days of food on hand)
    if targets["calories"] > 0 and total_pantry_cal > 0:
        est_days = round(total_pantry_cal / targets["calories"], 1)
    else:
        est_days = 0.0

    # Assume a standard 3-to-7 day household grocery planning horizon
    horizon_days = max(1.0, min(7.0, est_days if est_days >= 1.0 else 3.0))
    daily_available_protein = round(total_pantry_protein / horizon_days, 1)
    daily_available_cal = round(total_pantry_cal / horizon_days, 1)
    daily_available_carbs = round(total_pantry_carbs / horizon_days, 1)
    daily_available_fats = round(total_pantry_fats / horizon_days, 1)

    deficiencies: List[DeficiencyDetail] = []
    suggested_additions: List[SuggestedAddition] = []
    health_penalty = 0

    # 1. Protein Deficiency Check (Core USP )
    protein_gap = round(targets["protein_g"] - daily_available_protein, 1)
    if protein_gap > 15.0:
        health_penalty += 35
        severity = "Severely Deficient" if protein_gap > 40.0 else "Moderate Shortage"
        deficiencies.append(DeficiencyDetail(
            nutrient="Protein",
            status=severity,
            daily_requirement=targets["protein_g"],
            available_daily_est=daily_available_protein,
            daily_gap=protein_gap,
            unit="g",
            message=f"You are approximately {protein_gap:.0f}g short of your daily protein target ({targets['protein_g']:.0f}g needed vs {daily_available_protein:.0f}g available)."
        ))
        
        # Suggest high-protein grocery additions (e.g. Chicken, Greek Yogurt, Cottage Cheese, Lentils)
        suggested_additions.extend([
            SuggestedAddition(
                name="Chicken Breast",
                category="Protein",
                reason="Provides 31g lean protein per 100g with zero carbs, perfectly bridging your protein deficit.",
                suggested_qty=500.0,
                unit="g",
                impact_protein_g=155.0,
                impact_calories=825.0,
            ),
            SuggestedAddition(
                name="Greek Yogurt",
                category="Dairy",
                reason="High-density protein snack (10g protein/100g) rich in gut-healthy probiotics.",
                suggested_qty=400.0,
                unit="g",
                impact_protein_g=40.0,
                impact_calories=236.0,
            ),
            SuggestedAddition(
                name="Eggs",
                category="Protein",
                reason="Bioavailable protein with essential amino acids and healthy fats.",
                suggested_qty=12.0,
                unit="pcs",
                impact_protein_g=75.6,
                impact_calories=864.0,
            ),
            SuggestedAddition(
                name="Paneer (Cottage Cheese)",
                category="Protein",
                reason="Vegetarian protein powerhouse (18g protein/100g) providing slow-digesting casein.",
                suggested_qty=300.0,
                unit="g",
                impact_protein_g=54.0,
                impact_calories=795.0,
            ),
            SuggestedAddition(
                name="Lentils / Dal (Dry)",
                category="Protein",
                reason="Budget-friendly plant protein source providing 25g protein and high fiber.",
                suggested_qty=500.0,
                unit="g",
                impact_protein_g=125.0,
                impact_calories=1760.0,
            ),
        ])
    else:
        deficiencies.append(DeficiencyDetail(
            nutrient="Protein",
            status="Optimal",
            daily_requirement=targets["protein_g"],
            available_daily_est=daily_available_protein,
            daily_gap=0.0,
            unit="g",
            message=f"Protein reserves are solid. You have ~{daily_available_protein:.0f}g available daily toward your {targets['protein_g']:.0f}g target."
        ))

    # 2. Caloric Sufficiency Check
    cal_gap = round(targets["calories"] - daily_available_cal, 0)
    if cal_gap > 350.0:
        health_penalty += 20
        deficiencies.append(DeficiencyDetail(
            nutrient="Total Energy",
            status="Moderate Shortage",
            daily_requirement=targets["calories"],
            available_daily_est=daily_available_cal,
            daily_gap=cal_gap,
            unit="kcal",
            message=f"Pantry inventory is approximately {cal_gap:.0f} kcal below your daily energy requirement."
        ))
    else:
        deficiencies.append(DeficiencyDetail(
            nutrient="Total Energy",
            status="Optimal",
            daily_requirement=targets["calories"],
            available_daily_est=daily_available_cal,
            daily_gap=0.0,
            unit="kcal",
            message=f"Energy reserves sufficient (~{daily_available_cal:.0f} kcal/day available)."
        ))

    # 3. Vegetables & Micronutrient Diversity Check
    has_greens = any(
        item.category.lower() == "vegetables" or "spinach" in item.name.lower() or "broccoli" in item.name.lower()
        for item in pantry_items
    )
    if not has_greens:
        health_penalty += 20
        deficiencies.append(DeficiencyDetail(
            nutrient="Micronutrients & Fiber",
            status="Deficient",
            daily_requirement=30.0,
            available_daily_est=5.0,
            daily_gap=25.0,
            unit="g",
            message="No fresh leafy greens or fibrous vegetables found in pantry inventory."
        ))
        suggested_additions.append(SuggestedAddition(
            name="Spinach",
            category="Vegetables",
            reason="High in iron, folate, and vitamins A & C with minimal calories.",
            suggested_qty=250.0,
            unit="g",
            impact_protein_g=7.2,
            impact_calories=57.0,
        ))
        suggested_additions.append(SuggestedAddition(
            name="Broccoli",
            category="Vegetables",
            reason="Cruciferous vegetable delivering dietary fiber and cellular antioxidants.",
            suggested_qty=300.0,
            unit="g",
            impact_protein_g=8.4,
            impact_calories=102.0,
        ))

    # 4. Healthy Fats & Fatty Acids Check
    has_healthy_fats = any(
        item.category.lower() == "fats & oils" or "olive" in item.name.lower() or "almond" in item.name.lower() or "peanut" in item.name.lower()
        for item in pantry_items
    )
    if not has_healthy_fats:
        health_penalty += 15
        deficiencies.append(DeficiencyDetail(
            nutrient="Essential Healthy Fats",
            status="Moderate Shortage",
            daily_requirement=targets["fats_g"],
            available_daily_est=daily_available_fats,
            daily_gap=max(0.0, targets["fats_g"] - daily_available_fats),
            unit="g",
            message="Pantry lacks key sources of monounsaturated and essential fatty acids for joint and hormone health."
        ))
        suggested_additions.append(SuggestedAddition(
            name="Olive Oil",
            category="Fats & Oils",
            reason="Cardiovascular-protective monounsaturated cooking base.",
            suggested_qty=250.0,
            unit="ml",
            impact_protein_g=0.0,
            impact_calories=2200.0,
        ))

    overall_score = max(10, 100 - health_penalty)

    return NutritionalDeficiencyResponse(
        daily_target_calories=targets["calories"],
        daily_target_protein_g=targets["protein_g"],
        daily_target_carbs_g=targets["carbs_g"],
        daily_target_fats_g=targets["fats_g"],
        total_pantry_calories=round(total_pantry_cal, 1),
        total_pantry_protein_g=round(total_pantry_protein, 1),
        total_pantry_carbs_g=round(total_pantry_carbs, 1),
        total_pantry_fats_g=round(total_pantry_fats, 1),
        estimated_pantry_days=est_days,
        deficiencies=deficiencies,
        suggested_additions=suggested_additions,
        overall_health_score=overall_score,
    )


def generate_grocery_meal_plan(
    pantry_items: List[PantryItem], 
    profile: Optional[UserProfile]
) -> GeneratedMealPlanResponse:
    """
    Generates a full day's meal plan (Breakfast, Lunch, Dinner, Snack)
    using ONLY available pantry groceries .
    """
    targets = calculate_athlete_targets(profile)
    
    # Set of normalized user pantry ingredients
    pantry_tokens = set()
    for item in pantry_items:
        pantry_tokens.add(_normalize(item.name))
        for token in _normalize(item.name).split():
            if len(token) > 2:
                pantry_tokens.add(token)

    def is_ingredient_available(req_ing: str) -> bool:
        norm_req = _normalize(req_ing)
        if norm_req in pantry_tokens:
            return True
        for token in norm_req.split():
            if len(token) > 2 and token in pantry_tokens:
                return True
        return False

    # Score each recipe against available pantry inventory
    scored_recipes: List[Dict[str, Any]] = []
    all_missing_ingredients = set()

    for recipe in MASTER_RECIPE_CATALOG:
        required = recipe["required_ingredients"]
        matched_req = [ing for ing in required if is_ingredient_available(ing)]
        missing_req = [ing for ing in required if not is_ingredient_available(ing)]
        
        coverage = len(matched_req) / len(required) if required else 1.0
        
        if missing_req:
            all_missing_ingredients.update(missing_req)

        scored_recipes.append({
            **recipe,
            "coverage": coverage,
            "missing_ingredients": missing_req,
            "matched_ingredients": matched_req,
        })

    # Group recipes by meal type
    meal_types = ["breakfast", "lunch", "dinner", "snack"]
    selected_meals: List[PlannedMeal] = []
    used_ingredients = set()

    for m_type in meal_types:
        candidates = [r for r in scored_recipes if r["meal_type"] == m_type]
        
        # 1. First priority: 100% matched recipes using ONLY available groceries
        perfect_candidates = [r for r in candidates if r["coverage"] >= 1.0]
        
        if perfect_candidates:
            # Pick candidate closest to target meal calorie ratio
            chosen = perfect_candidates[0]
        elif candidates:
            # Pick highest partial match
            candidates.sort(key=lambda r: r["coverage"], reverse=True)
            chosen = candidates[0]
        else:
            continue

        for ing in chosen["matched_ingredients"]:
            used_ingredients.add(ing)

        selected_meals.append(PlannedMeal(
            meal_type=m_type,
            recipe_id=chosen["id"],
            title=chosen["title"],
            ingredient_summary=chosen["ingredient_summary"],
            instructions=chosen["instructions"],
            prep_time_min=chosen["prep_time_min"],
            calories=chosen["base_calories"],
            protein_g=chosen["base_protein_g"],
            carbs_g=chosen["base_carbs_g"],
            fats_g=chosen["base_fats_g"],
            tags=chosen.get("tags", []),
            pantry_coverage_percent=round(chosen["coverage"] * 100.0, 1),
        ))

    plan_cal = sum(m.calories for m in selected_meals)
    plan_protein = sum(m.protein_g for m in selected_meals)
    plan_carbs = sum(m.carbs_g for m in selected_meals)
    plan_fats = sum(m.fats_g for m in selected_meals)

    # Missing ingredients that would unlock more high-value recipes
    next_unlocks = sorted(list(all_missing_ingredients))[:5]

    if not selected_meals or all(m.pantry_coverage_percent < 50.0 for m in selected_meals):
        msg = "Pantry inventory is very low. Add a few staples like Eggs, Oats, Rice, or Chicken to generate complete meals."
    else:
        msg = f"Generated daily plan using {len(used_ingredients)} pantry ingredients on hand."

    return GeneratedMealPlanResponse(
        title="Smart Grocery Fuel Plan",
        target_calories=targets["calories"],
        target_protein_g=targets["protein_g"],
        target_carbs_g=targets["carbs_g"],
        target_fats_g=targets["fats_g"],
        plan_total_calories=round(plan_cal, 1),
        plan_total_protein_g=round(plan_protein, 1),
        plan_total_carbs_g=round(plan_carbs, 1),
        plan_total_fats_g=round(plan_fats, 1),
        meals=selected_meals,
        available_ingredients_used=sorted(list(used_ingredients)),
        missing_ingredients_to_unlock_more=next_unlocks,
        message=msg,
    )
