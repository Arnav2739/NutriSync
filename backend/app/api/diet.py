from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import uuid

from app.db.database import get_db
from app.models.user import User
from app.models.profile import UserProfile
from app.models.grocery import PantryItem, SavedMealPlan, ShoppingListItem
from app.schemas.grocery import (
    PantryItemCreate,
    PantryItemUpdate,
    PantryItemResponse,
    PantryBulkAdd,
    GroceryCatalogItem,
    NutritionalDeficiencyResponse,
    GeneratedMealPlanResponse,
    ShoppingListItemCreate,
    ShoppingListItemResponse,
    BulkShoppingListAdd,
)
from app.core.security import get_current_user
from app.db.grocery_catalog import MASTER_GROCERY_CATALOG
from app.services.diet_generator import (
    calculate_item_nutrition,
    detect_nutritional_deficiencies,
    generate_grocery_meal_plan,
)

router = APIRouter(prefix="/diet", tags=["Smart Grocery Diet Planner"])


# ══════════════════════════════════════════════════════════════════════════════
# MASTER CATALOG & STAPLE ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/catalog", response_model=List[GroceryCatalogItem])
def get_grocery_catalog(category: Optional[str] = None):
    """Retrieve master staple grocery catalog with nutritional densities."""
    if category:
        return [item for item in MASTER_GROCERY_CATALOG if item["category"].lower() == category.lower()]
    return MASTER_GROCERY_CATALOG


# ══════════════════════════════════════════════════════════════════════════════
# PANTRY INVENTORY MANAGEMENT (Proposal §6.3)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/pantry", response_model=List[PantryItemResponse])
def get_pantry_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all groceries currently logged in user's pantry inventory."""
    return db.query(PantryItem).filter(PantryItem.user_id == current_user.id).order_by(PantryItem.category, PantryItem.name).all()


@router.post("/pantry", response_model=PantryItemResponse, status_code=status.HTTP_201_CREATED)
def add_pantry_item(
    item_in: PantryItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add a grocery item to user's pantry.
    Auto-computes calories, protein, carbs, and fats from Master Catalog if omitted.
    """
    cal, prot, carb, fat, unit, cat = calculate_item_nutrition(
        name=item_in.name,
        quantity=item_in.quantity,
        unit=item_in.unit,
        category=item_in.category,
    )

    calories = item_in.calories if item_in.calories is not None else cal
    protein_g = item_in.protein_g if item_in.protein_g is not None else prot
    carbs_g = item_in.carbs_g if item_in.carbs_g is not None else carb
    fats_g = item_in.fats_g if item_in.fats_g is not None else fat
    final_unit = item_in.unit or unit
    final_cat = item_in.category or cat

    # Check if item with same name already exists; if so, aggregate quantity
    existing = db.query(PantryItem).filter(
        PantryItem.user_id == current_user.id,
        PantryItem.name.ilike(item_in.name.strip())
    ).first()

    if existing:
        existing.quantity += item_in.quantity
        existing.calories += calories
        existing.protein_g += protein_g
        existing.carbs_g += carbs_g
        existing.fats_g += fats_g
        db.commit()
        db.refresh(existing)
        return existing

    pantry_item = PantryItem(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=item_in.name.strip(),
        category=final_cat,
        quantity=item_in.quantity,
        unit=final_unit,
        calories=calories,
        protein_g=protein_g,
        carbs_g=carbs_g,
        fats_g=fats_g,
    )
    db.add(pantry_item)
    db.commit()
    db.refresh(pantry_item)
    return pantry_item


@router.post("/pantry/bulk", response_model=List[PantryItemResponse], status_code=status.HTTP_201_CREATED)
def bulk_add_pantry_items(
    bulk_in: PantryBulkAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add multiple staple grocery items to pantry in a single transaction."""
    added_items = []
    for item_in in bulk_in.items:
        cal, prot, carb, fat, unit, cat = calculate_item_nutrition(
            name=item_in.name,
            quantity=item_in.quantity,
            unit=item_in.unit,
            category=item_in.category,
        )

        pantry_item = PantryItem(
            id=uuid.uuid4(),
            user_id=current_user.id,
            name=item_in.name.strip(),
            category=item_in.category or cat,
            quantity=item_in.quantity,
            unit=item_in.unit or unit,
            calories=item_in.calories if item_in.calories is not None else cal,
            protein_g=item_in.protein_g if item_in.protein_g is not None else prot,
            carbs_g=item_in.carbs_g if item_in.carbs_g is not None else carb,
            fats_g=item_in.fats_g if item_in.fats_g is not None else fat,
        )
        db.add(pantry_item)
        added_items.append(pantry_item)

    db.commit()
    for item in added_items:
        db.refresh(item)
    return added_items


@router.put("/pantry/{item_id}", response_model=PantryItemResponse)
def update_pantry_item(
    item_id: UUID,
    item_update: PantryItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update quantity or unit of an existing pantry item."""
    item = db.query(PantryItem).filter(PantryItem.id == item_id, PantryItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pantry item not found")

    if item_update.quantity is not None:
        ratio = item_update.quantity / item.quantity if item.quantity > 0 else 1.0
        item.quantity = item_update.quantity
        item.calories = round(item.calories * ratio, 1)
        item.protein_g = round(item.protein_g * ratio, 1)
        item.carbs_g = round(item.carbs_g * ratio, 1)
        item.fats_g = round(item.fats_g * ratio, 1)

    if item_update.unit:
        item.unit = item_update.unit

    db.commit()
    db.refresh(item)
    return item


@router.delete("/pantry/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pantry_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a single item from the pantry."""
    item = db.query(PantryItem).filter(PantryItem.id == item_id, PantryItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pantry item not found")
    db.delete(item)
    db.commit()
    return None


@router.delete("/pantry", status_code=status.HTTP_204_NO_CONTENT)
def clear_pantry(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clear all items from user's pantry."""
    db.query(PantryItem).filter(PantryItem.user_id == current_user.id).delete()
    db.commit()
    return None


# ══════════════════════════════════════════════════════════════════════════════
# NUTRITIONAL DEFICIENCY DETECTION (Proposal §6.4)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/deficiency-analysis", response_model=NutritionalDeficiencyResponse)
def get_deficiency_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Compares current pantry inventory against user's clinical macro/energy targets.
    Flags protein shortages, fiber/greens shortages, and suggests grocery additions.
    """
    pantry_items = db.query(PantryItem).filter(PantryItem.user_id == current_user.id).all()
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    return detect_nutritional_deficiencies(pantry_items, profile)


# ══════════════════════════════════════════════════════════════════════════════
# SMART GROCERY MEAL PLAN GENERATOR (Proposal §6.3)
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/generate-meal-plan", response_model=GeneratedMealPlanResponse)
def generate_meal_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates a personalized daily meal plan using ONLY ingredients present in the user's pantry.
    Matches recipes for Breakfast, Lunch, Dinner, and Snack calibrated to target macros.
    """
    pantry_items = db.query(PantryItem).filter(PantryItem.user_id == current_user.id).all()
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    return generate_grocery_meal_plan(pantry_items, profile)


# ══════════════════════════════════════════════════════════════════════════════
# SMART SHOPPING LIST GENERATOR (Proposal §6.5)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/shopping-list", response_model=List[ShoppingListItemResponse])
def get_shopping_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve user's smart shopping list."""
    return db.query(ShoppingListItem).filter(ShoppingListItem.user_id == current_user.id).order_by(ShoppingListItem.is_purchased, ShoppingListItem.created_at.desc()).all()


@router.post("/shopping-list", response_model=ShoppingListItemResponse, status_code=status.HTTP_201_CREATED)
def add_shopping_list_item(
    item_in: ShoppingListItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add an item to the shopping list."""
    item = ShoppingListItem(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=item_in.name.strip(),
        category=item_in.category or "Other",
        quantity=item_in.quantity,
        unit=item_in.unit,
        reason=item_in.reason,
        is_purchased=False,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post("/shopping-list/bulk", response_model=List[ShoppingListItemResponse], status_code=status.HTTP_201_CREATED)
def bulk_add_shopping_list_items(
    bulk_in: BulkShoppingListAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bulk add items to the shopping list (e.g. from deficiency suggestions)."""
    added = []
    for item_in in bulk_in.items:
        item = ShoppingListItem(
            id=uuid.uuid4(),
            user_id=current_user.id,
            name=item_in.name.strip(),
            category=item_in.category or "Other",
            quantity=item_in.quantity,
            unit=item_in.unit,
            reason=item_in.reason,
            is_purchased=False,
        )
        db.add(item)
        added.append(item)
    db.commit()
    for it in added:
        db.refresh(it)
    return added


@router.patch("/shopping-list/{item_id}/toggle", response_model=ShoppingListItemResponse)
def toggle_shopping_list_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle is_purchased status of a shopping list item."""
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id, ShoppingListItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found")
    item.is_purchased = not item.is_purchased
    db.commit()
    db.refresh(item)
    return item


@router.post("/shopping-list/{item_id}/transfer-to-pantry", response_model=PantryItemResponse)
def transfer_shopping_item_to_pantry(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Marks a shopping list item as purchased and directly transfers it
    into the user's pantry inventory with auto-computed nutrition.
    """
    shop_item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id, ShoppingListItem.user_id == current_user.id).first()
    if not shop_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found")

    # Calculate nutrition
    cal, prot, carb, fat, unit, cat = calculate_item_nutrition(
        name=shop_item.name,
        quantity=shop_item.quantity,
        unit=shop_item.unit,
        category=shop_item.category,
    )

    # Check if already in pantry
    existing_pantry = db.query(PantryItem).filter(
        PantryItem.user_id == current_user.id,
        PantryItem.name.ilike(shop_item.name.strip())
    ).first()

    if existing_pantry:
        existing_pantry.quantity += shop_item.quantity
        existing_pantry.calories += cal
        existing_pantry.protein_g += prot
        existing_pantry.carbs_g += carb
        existing_pantry.fats_g += fat
        pantry_result = existing_pantry
    else:
        pantry_result = PantryItem(
            id=uuid.uuid4(),
            user_id=current_user.id,
            name=shop_item.name.strip(),
            category=shop_item.category or cat,
            quantity=shop_item.quantity,
            unit=shop_item.unit or unit,
            calories=cal,
            protein_g=prot,
            carbs_g=carb,
            fats_g=fat,
        )
        db.add(pantry_result)

    # Delete or mark purchased in shopping list
    db.delete(shop_item)
    db.commit()
    db.refresh(pantry_result)
    return pantry_result


@router.delete("/shopping-list/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shopping_list_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an item from the shopping list."""
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id, ShoppingListItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found")
    db.delete(item)
    db.commit()
    return None
