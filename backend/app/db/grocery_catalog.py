"""
Master Grocery and Recipe Catalog for NutriSync Sprint C (Proposal §6.3 - §6.5)
Contains standardized athletic and pantry staple ingredients with exact nutritional densities,
paired with a rich recipe matrix for grocery-based meal generation.
"""

# Master Grocery Catalog with standardized nutrition per default unit
MASTER_GROCERY_CATALOG = [
    # --- Proteins ---
    {
        "name": "Chicken Breast",
        "category": "Protein",
        "default_unit": "g",
        "serving_size": 100.0,
        "calories": 165.0,
        "protein_g": 31.0,
        "carbs_g": 0.0,
        "fats_g": 3.6,
        "is_pantry_staple": True,
        "tags": ["high-protein", "lean", "muscle-building"]
    },
    {
        "name": "Eggs",
        "category": "Protein",
        "default_unit": "pcs",
        "serving_size": 1.0,  # 1 large egg ~50g
        "calories": 72.0,
        "protein_g": 6.3,
        "carbs_g": 0.4,
        "fats_g": 4.8,
        "is_pantry_staple": True,
        "tags": ["high-protein", "versatile", "breakfast"]
    },
    {
        "name": "Egg Whites",
        "category": "Protein",
        "default_unit": "ml",
        "serving_size": 100.0,
        "calories": 52.0,
        "protein_g": 11.0,
        "carbs_g": 0.7,
        "fats_g": 0.2,
        "is_pantry_staple": False,
        "tags": ["lean-protein", "low-calorie"]
    },
    {
        "name": "Canned Tuna",
        "category": "Protein",
        "default_unit": "g",
        "serving_size": 100.0,
        "calories": 116.0,
        "protein_g": 26.0,
        "carbs_g": 0.0,
        "fats_g": 1.0,
        "is_pantry_staple": True,
        "tags": ["high-protein", "budget", "pantry-friendly"]
    },
    {
        "name": "Salmon Fillet",
        "category": "Protein",
        "default_unit": "g",
        "serving_size": 100.0,
        "calories": 208.0,
        "protein_g": 20.0,
        "carbs_g": 0.0,
        "fats_g": 13.0,
        "is_pantry_staple": False,
        "tags": ["healthy-fats", "omega-3", "fish"]
    },
    {
        "name": "Tofu (Firm)",
        "category": "Protein",
        "default_unit": "g",
        "serving_size": 100.0,
        "calories": 76.0,
        "protein_g": 8.0,
        "carbs_g": 1.9,
        "fats_g": 4.8,
        "is_pantry_staple": True,
        "tags": ["vegan", "vegetarian", "plant-protein"]
    },
    {
        "name": "Paneer (Cottage Cheese)",
        "category": "Protein",
        "default_unit": "g",
        "serving_size": 100.0,
        "calories": 265.0,
        "protein_g": 18.0,
        "carbs_g": 3.0,
        "fats_g": 20.0,
        "is_pantry_staple": True,
        "tags": ["vegetarian", "calcium", "high-protein"]
    },
    {
        "name": "Greek Yogurt",
        "category": "Dairy",
        "default_unit": "g",
        "serving_size": 100.0,
        "calories": 59.0,
        "protein_g": 10.0,
        "carbs_g": 3.6,
        "fats_g": 0.4,
        "is_pantry_staple": True,
        "tags": ["probiotic", "high-protein", "snack"]
    },
    {
        "name": "Whey Protein Powder",
        "category": "Protein",
        "default_unit": "scoops",
        "serving_size": 1.0,  # 1 scoop ~30g
        "calories": 120.0,
        "protein_g": 24.0,
        "carbs_g": 2.0,
        "fats_g": 1.5,
        "is_pantry_staple": True,
        "tags": ["high-protein", "post-workout", "supplement"]
    },
    {
        "name": "Lentils / Dal (Dry)",
        "category": "Protein",
        "default_unit": "g",
        "serving_size": 100.0,
        "calories": 352.0,
        "protein_g": 25.0,
        "carbs_g": 60.0,
        "fats_g": 1.0,
        "is_pantry_staple": True,
        "tags": ["vegetarian", "fiber", "budget"]
    },
    {
        "name": "Chickpeas (Boiled / Canned)",
        "category": "Protein",
        "default_unit": "g",
        "serving_size": 100.0,
        "calories": 164.0,
        "protein_g": 8.9,
        "carbs_g": 27.4,
        "fats_g": 2.6,
        "is_pantry_staple": True,
        "tags": ["plant-protein", "fiber", "vegan"]
    },

    # --- Grains & Carbohydrates ---
    {
        "name": "White Rice",
        "category": "Grains & Carbs",
        "default_unit": "g",
        "serving_size": 100.0,  # dry
        "calories": 360.0,
        "protein_g": 7.0,
        "carbs_g": 80.0,
        "fats_g": 0.6,
        "is_pantry_staple": True,
        "tags": ["fast-digesting", "energy", "staple"]
    },
    {
        "name": "Brown Rice",
        "category": "Grains & Carbs",
        "default_unit": "g",
        "serving_size": 100.0,  # dry
        "calories": 362.0,
        "protein_g": 7.5,
        "carbs_g": 76.0,
        "fats_g": 2.7,
        "is_pantry_staple": True,
        "tags": ["fiber", "slow-digesting", "complex-carbs"]
    },
    {
        "name": "Rolled Oats",
        "category": "Grains & Carbs",
        "default_unit": "g",
        "serving_size": 100.0,
        "calories": 389.0,
        "protein_g": 16.9,
        "carbs_g": 66.3,
        "fats_g": 6.9,
        "is_pantry_staple": True,
        "tags": ["breakfast", "fiber", "heart-healthy"]
    },
    {
        "name": "Whole Wheat Bread",
        "category": "Grains & Carbs",
        "default_unit": "slices",
        "serving_size": 1.0,  # 1 slice ~40g
        "calories": 95.0,
        "protein_g": 4.0,
        "carbs_g": 18.0,
        "fats_g": 1.0,
        "is_pantry_staple": True,
        "tags": ["breakfast", "sandwich", "staple"]
    },
    {
        "name": "Potatoes",
        "category": "Grains & Carbs",
        "default_unit": "g",
        "serving_size": 100.0,
        "calories": 77.0,
        "protein_g": 2.0,
        "carbs_g": 17.5,
        "fats_g": 0.1,
        "is_pantry_staple": True,
        "tags": ["potassium", "complex-carbs", "satiety"]
    },
    {
        "name": "Sweet Potatoes",
        "category": "Grains & Carbs",
        "default_unit": "g",
        "serving_size": 100.0,
        "calories": 86.0,
        "protein_g": 1.6,
        "carbs_g": 20.1,
        "fats_g": 0.1,
        "is_pantry_staple": False,
        "tags": ["vit-a", "antioxidants", "clean-carbs"]
    },
    {
        "name": "Pasta (Dry)",
        "category": "Grains & Carbs",
        "default_unit": "g",
        "serving_size": 100.0,
        "calories": 371.0,
        "protein_g": 13.0,
        "carbs_g": 74.0,
        "fats_g": 1.5,
        "is_pantry_staple": True,
        "tags": ["quick", "dinner", "carbs"]
    },

    # --- Vegetables ---
    {
        "name": "Spinach",
        "category": "Vegetables",
        "default_unit": "g",
        "serving_size": 100.0,
        "calories": 23.0,
        "protein_g": 2.9,
        "carbs_g": 3.6,
        "fats_g": 0.4,
        "is_pantry_staple": True,
        "tags": ["greens", "iron", "micronutrients"]
    },
    {
        "name": "Tomatoes",
        "category": "Vegetables",
        "default_unit": "pcs",
        "serving_size": 1.0,  # 1 medium ~120g
        "calories": 22.0,
        "protein_g": 1.1,
        "carbs_g": 4.8,
        "fats_g": 0.2,
        "is_pantry_staple": True,
        "tags": ["lycopene", "salad", "base"]
    },
    {
        "name": "Onions",
        "category": "Vegetables",
        "default_unit": "pcs",
        "serving_size": 1.0,  # 1 medium ~110g
        "calories": 44.0,
        "protein_g": 1.2,
        "carbs_g": 10.2,
        "fats_g": 0.1,
        "is_pantry_staple": True,
        "tags": ["flavor", "staple", "aromatic"]
    },
    {
        "name": "Broccoli",
        "category": "Vegetables",
        "default_unit": "g",
        "serving_size": 100.0,
        "calories": 34.0,
        "protein_g": 2.8,
        "carbs_g": 6.6,
        "fats_g": 0.4,
        "is_pantry_staple": True,
        "tags": ["cruciferous", "fiber", "athletic-favorite"]
    },
    {
        "name": "Bell Peppers",
        "category": "Vegetables",
        "default_unit": "pcs",
        "serving_size": 1.0,  # 1 pepper ~120g
        "calories": 24.0,
        "protein_g": 1.0,
        "carbs_g": 5.5,
        "fats_g": 0.2,
        "is_pantry_staple": False,
        "tags": ["vit-c", "stir-fry", "crunchy"]
    },
    {
        "name": "Garlic",
        "category": "Vegetables",
        "default_unit": "pcs",  # cloves
        "serving_size": 3.0,
        "calories": 14.0,
        "protein_g": 0.6,
        "carbs_g": 3.0,
        "fats_g": 0.1,
        "is_pantry_staple": True,
        "tags": ["immunity", "seasoning"]
    },

    # --- Dairy & Alternatives ---
    {
        "name": "Milk (Cow / Dairy)",
        "category": "Dairy",
        "default_unit": "ml",
        "serving_size": 100.0,
        "calories": 60.0,
        "protein_g": 3.2,
        "carbs_g": 4.8,
        "fats_g": 3.3,
        "is_pantry_staple": True,
        "tags": ["calcium", "oats-companion", "beverage"]
    },
    {
        "name": "Almond Milk (Unsweetened)",
        "category": "Dairy",
        "default_unit": "ml",
        "serving_size": 100.0,
        "calories": 13.0,
        "protein_g": 0.4,
        "carbs_g": 0.3,
        "fats_g": 1.1,
        "is_pantry_staple": False,
        "tags": ["low-calorie", "vegan", "dairy-free"]
    },

    # --- Healthy Fats & Oils ---
    {
        "name": "Olive Oil",
        "category": "Fats & Oils",
        "default_unit": "ml",
        "serving_size": 10.0,  # 1 tbsp ~10ml
        "calories": 88.0,
        "protein_g": 0.0,
        "carbs_g": 0.0,
        "fats_g": 10.0,
        "is_pantry_staple": True,
        "tags": ["monounsaturated", "cooking", "longevity"]
    },
    {
        "name": "Peanut Butter",
        "category": "Fats & Oils",
        "default_unit": "g",
        "serving_size": 32.0,  # 2 tbsp
        "calories": 188.0,
        "protein_g": 8.0,
        "carbs_g": 6.0,
        "fats_g": 16.0,
        "is_pantry_staple": True,
        "tags": ["dense-calories", "snack", "tasty"]
    },
    {
        "name": "Almonds",
        "category": "Fats & Oils",
        "default_unit": "g",
        "serving_size": 30.0,
        "calories": 174.0,
        "protein_g": 6.3,
        "carbs_g": 6.6,
        "fats_g": 15.0,
        "is_pantry_staple": True,
        "tags": ["vit-e", "nuts", "healthy-snack"]
    },

    # --- Fruits ---
    {
        "name": "Bananas",
        "category": "Fruits",
        "default_unit": "pcs",
        "serving_size": 1.0,  # 1 medium ~118g
        "calories": 105.0,
        "protein_g": 1.3,
        "carbs_g": 27.0,
        "fats_g": 0.3,
        "is_pantry_staple": True,
        "tags": ["pre-workout", "potassium", "energy"]
    },
    {
        "name": "Apples",
        "category": "Fruits",
        "default_unit": "pcs",
        "serving_size": 1.0,  # 1 medium ~180g
        "calories": 95.0,
        "protein_g": 0.5,
        "carbs_g": 25.0,
        "fats_g": 0.3,
        "is_pantry_staple": True,
        "tags": ["fiber", "snack", "antioxidant"]
    }
]


# Master Recipe Catalog (Strictly mappings of pantry ingredients to practical meals)
MASTER_RECIPE_CATALOG = [
    # --- Breakfast ---
    {
        "id": "rec_oats_protein_bowl",
        "title": "High-Protein Rolled Oats Bowl",
        "meal_type": "breakfast",
        "required_ingredients": ["Rolled Oats", "Milk (Cow / Dairy)"],
        "optional_ingredients": ["Bananas", "Peanut Butter", "Whey Protein Powder"],
        "ingredient_summary": "100g Rolled Oats cooked with 200ml Milk, topped with sliced Banana or Peanut Butter",
        "instructions": "1. Bring milk to a simmer in a saucepan. 2. Stir in rolled oats and reduce heat to low for 4-5 minutes. 3. Transfer to bowl and top with sliced bananas or peanut butter.",
        "prep_time_min": 7,
        "base_calories": 509.0,
        "base_protein_g": 23.3,
        "base_carbs_g": 75.9,
        "base_fats_g": 13.5,
        "tags": ["High-Protein", "Vegetarian", "Quick"]
    },
    {
        "id": "rec_boiled_eggs_toast",
        "title": "Classic Boiled Eggs & Whole Wheat Toast",
        "meal_type": "breakfast",
        "required_ingredients": ["Eggs", "Whole Wheat Bread"],
        "optional_ingredients": ["Tomatoes", "Spinach"],
        "ingredient_summary": "3 Boiled Eggs with 2 slices of Whole Wheat Toast and optional tomato slices",
        "instructions": "1. Boil eggs in simmering water for 7-9 minutes. 2. Toast bread slices until golden brown. 3. Peel eggs, season with salt and pepper, and serve alongside toast.",
        "prep_time_min": 10,
        "base_calories": 406.0,
        "base_protein_g": 26.9,
        "base_carbs_g": 37.2,
        "base_fats_g": 16.4,
        "tags": ["High-Protein", "Fast", "Breakfast Staple"]
    },
    {
        "id": "rec_scrambled_eggs_spinach",
        "title": "Spinach & Onion Scrambled Eggs",
        "meal_type": "breakfast",
        "required_ingredients": ["Eggs", "Spinach", "Onions"],
        "optional_ingredients": ["Tomatoes", "Olive Oil"],
        "ingredient_summary": "3 Eggs scrambled with 80g fresh Spinach and chopped Onions",
        "instructions": "1. Sauté diced onions in a lightly oiled pan for 2 minutes. 2. Add spinach and let wilt. 3. Pour in beaten eggs, stir gently until fluffy and cooked through.",
        "prep_time_min": 8,
        "base_calories": 278.0,
        "base_protein_g": 22.3,
        "base_carbs_g": 14.1,
        "base_fats_g": 15.0,
        "tags": ["Low-Carb", "Keto", "High-Protein", "Vegetarian"]
    },
    {
        "id": "rec_banana_pb_toast",
        "title": "Peanut Butter & Banana Energy Toast",
        "meal_type": "breakfast",
        "required_ingredients": ["Whole Wheat Bread", "Peanut Butter", "Bananas"],
        "optional_ingredients": ["Almonds"],
        "ingredient_summary": "2 slices Whole Wheat Toast spread with 32g Peanut Butter and 1 sliced Banana",
        "instructions": "1. Toast whole wheat bread. 2. Spread peanut butter evenly over warm toast. 3. Top with sliced banana.",
        "prep_time_min": 5,
        "base_calories": 483.0,
        "base_protein_g": 17.3,
        "base_carbs_g": 69.0,
        "base_fats_g": 18.3,
        "tags": ["Vegetarian", "Vegan", "Energy", "Pre-Workout"]
    },
    {
        "id": "rec_greek_yogurt_fruit_parfait",
        "title": "Greek Yogurt & Fruit Athletic Bowl",
        "meal_type": "breakfast",
        "required_ingredients": ["Greek Yogurt"],
        "optional_ingredients": ["Bananas", "Apples", "Almonds", "Rolled Oats"],
        "ingredient_summary": "200g Greek Yogurt paired with fresh sliced Fruit and Almonds",
        "instructions": "1. Spoon Greek Yogurt into a bowl. 2. Layer with sliced bananas, diced apples, and crushed almonds.",
        "prep_time_min": 4,
        "base_calories": 328.0,
        "base_protein_g": 24.6,
        "base_carbs_g": 41.2,
        "base_fats_g": 7.8,
        "tags": ["High-Protein", "Vegetarian", "No-Cook"]
    },

    # --- Lunch ---
    {
        "id": "rec_chicken_rice_spinach",
        "title": "Seared Chicken Breast, Steamed Rice & Spinach",
        "meal_type": "lunch",
        "required_ingredients": ["Chicken Breast", "White Rice", "Spinach"],
        "optional_ingredients": ["Onions", "Olive Oil", "Garlic"],
        "ingredient_summary": "180g Chicken Breast, 100g Rice, and 80g steamed Spinach",
        "instructions": "1. Cook white rice. 2. Season chicken breast and pan-sear for 6-7 min per side until 75°C. 3. Steam or quickly sauté spinach and serve together.",
        "prep_time_min": 20,
        "base_calories": 675.0,
        "base_protein_g": 65.1,
        "base_carbs_g": 82.9,
        "base_fats_g": 7.4,
        "tags": ["High-Protein", "Bodybuilding Classic", "Clean-Fuel"]
    },
    {
        "id": "rec_chicken_rice_broccoli",
        "title": "Athlete Gold Standard: Chicken, Brown Rice & Broccoli",
        "meal_type": "lunch",
        "required_ingredients": ["Chicken Breast", "Brown Rice", "Broccoli"],
        "optional_ingredients": ["Olive Oil", "Garlic"],
        "ingredient_summary": "180g Grilled Chicken Breast, 100g Brown Rice, and 100g steamed Broccoli",
        "instructions": "1. Cook brown rice. 2. Grill or bake chicken breast with basic seasoning. 3. Steam broccoli for 4 minutes until vibrant green. Plate together.",
        "prep_time_min": 25,
        "base_calories": 693.0,
        "base_protein_g": 66.1,
        "base_carbs_g": 82.6,
        "base_fats_g": 9.6,
        "tags": ["High-Protein", "Clean", "Complex-Carbs"]
    },
    {
        "id": "rec_tuna_rice_salad",
        "title": "Tuna, Rice & Tomato Protein Bowl",
        "meal_type": "lunch",
        "required_ingredients": ["Canned Tuna", "White Rice", "Tomatoes"],
        "optional_ingredients": ["Onions", "Spinach", "Olive Oil"],
        "ingredient_summary": "150g Tuna with 100g Steamed Rice, diced Tomatoes and sliced Onions",
        "instructions": "1. Fluff cooked rice in a bowl. 2. Drain tuna and flake over rice. 3. Dice fresh tomatoes and onions; toss lightly with black pepper and olive oil.",
        "prep_time_min": 8,
        "base_calories": 556.0,
        "base_protein_g": 47.1,
        "base_carbs_g": 84.8,
        "base_fats_g": 2.3,
        "tags": ["Budget", "High-Protein", "Fast Prep"]
    },
    {
        "id": "rec_paneer_stir_fry_rice",
        "title": "Cottage Cheese (Paneer) & Veggie Stir-Fry with Rice",
        "meal_type": "lunch",
        "required_ingredients": ["Paneer (Cottage Cheese)", "White Rice", "Tomatoes", "Onions"],
        "optional_ingredients": ["Spinach", "Bell Peppers"],
        "ingredient_summary": "150g cubed Paneer sautéed with Onions, Tomatoes, served over 100g Rice",
        "instructions": "1. Sauté diced onions and tomatoes in a pan until soft. 2. Add cubed paneer and light spices; cook for 4-5 minutes. 3. Serve alongside warm steamed rice.",
        "prep_time_min": 18,
        "base_calories": 823.0,
        "base_protein_g": 36.3,
        "base_carbs_g": 95.0,
        "base_fats_g": 30.3,
        "tags": ["Vegetarian", "High-Protein", "Comfort Food"]
    },
    {
        "id": "rec_lentil_dal_rice",
        "title": "Wholesome Lentil Dal with Steamed Rice",
        "meal_type": "lunch",
        "required_ingredients": ["Lentils / Dal (Dry)", "White Rice", "Onions", "Tomatoes"],
        "optional_ingredients": ["Spinach", "Garlic"],
        "ingredient_summary": "100g Lentils simmered with Onions, Garlic & Tomatoes, served with 100g Rice",
        "instructions": "1. Cook lentils with water, turmeric and salt until tender. 2. Temper diced onions, garlic and tomatoes in a pan, then stir into cooked dal. 3. Serve over rice.",
        "prep_time_min": 25,
        "base_calories": 778.0,
        "base_protein_g": 34.3,
        "base_carbs_g": 155.0,
        "base_fats_g": 1.9,
        "tags": ["Vegan", "Vegetarian", "High-Fiber", "Budget Staple"]
    },
    {
        "id": "rec_tofu_veggie_rice",
        "title": "Crispy Tofu & Green Veggie Bowl with Rice",
        "meal_type": "lunch",
        "required_ingredients": ["Tofu (Firm)", "White Rice", "Spinach"],
        "optional_ingredients": ["Broccoli", "Onions"],
        "ingredient_summary": "180g pan-seared Tofu with 100g Rice and wilted Greens",
        "instructions": "1. Press and cube tofu; pan-sear until golden on all sides. 2. Steam greens. 3. Assemble bowl with steamed rice, tofu, and greens.",
        "prep_time_min": 15,
        "base_calories": 515.0,
        "base_protein_g": 23.7,
        "base_carbs_g": 82.9,
        "base_fats_g": 9.0,
        "tags": ["Vegan", "Vegetarian", "Plant-Based"]
    },

    # --- Dinner ---
    {
        "id": "rec_chicken_stir_fry_rice",
        "title": "Rustic Chicken & Onion Stir-Fry with Rice",
        "meal_type": "dinner",
        "required_ingredients": ["Chicken Breast", "Onions", "White Rice"],
        "optional_ingredients": ["Tomatoes", "Spinach", "Broccoli", "Bell Peppers"],
        "ingredient_summary": "180g Chicken Breast strips stir-fried with sliced Onions & Tomatoes over 100g Rice",
        "instructions": "1. Slice chicken breast into thin strips. 2. Stir-fry onions in a hot pan, add chicken, tomatoes, and vegetables. 3. Serve sizzling hot over white rice.",
        "prep_time_min": 15,
        "base_calories": 702.0,
        "base_protein_g": 64.0,
        "base_carbs_g": 90.2,
        "base_fats_g": 7.1,
        "tags": ["High-Protein", "Dinner", "Quick Stir-Fry"]
    },
    {
        "id": "rec_salmon_potatoes_spinach",
        "title": "Pan-Seared Salmon, Boiled Potatoes & Spinach",
        "meal_type": "dinner",
        "required_ingredients": ["Salmon Fillet", "Potatoes", "Spinach"],
        "optional_ingredients": ["Olive Oil", "Garlic"],
        "ingredient_summary": "150g Salmon fillet, 200g Boiled Potatoes, and sautéed Spinach",
        "instructions": "1. Boil diced potatoes until tender. 2. Pan-sear salmon skin-down for 4 min, flip and finish for 3 min. 3. Sauté spinach lightly with garlic.",
        "prep_time_min": 20,
        "base_calories": 484.0,
        "base_protein_g": 36.3,
        "base_carbs_g": 38.6,
        "base_fats_g": 20.3,
        "tags": ["Healthy-Fats", "Omega-3", "Restorative-Dinner"]
    },
    {
        "id": "rec_pasta_chicken_tomato",
        "title": "Tomato Herb Chicken Pasta",
        "meal_type": "dinner",
        "required_ingredients": ["Pasta (Dry)", "Chicken Breast", "Tomatoes", "Onions"],
        "optional_ingredients": ["Spinach", "Olive Oil", "Garlic"],
        "ingredient_summary": "100g Pasta tossed with 150g sautéed Chicken Breast and fresh Tomato-Onion sauce",
        "instructions": "1. Boil pasta in salted water. 2. Sauté onions, garlic, and crushed tomatoes to form sauce. 3. Add diced cooked chicken and combine with pasta.",
        "prep_time_min": 20,
        "base_calories": 684.0,
        "base_protein_g": 61.8,
        "base_carbs_g": 89.0,
        "base_fats_g": 7.2,
        "tags": ["High-Protein", "Carb-Load", "Dinner"]
    },
    {
        "id": "rec_boiled_eggs_potato_salad",
        "title": "Rustic Egg & Potato Recovery Plate",
        "meal_type": "dinner",
        "required_ingredients": ["Eggs", "Potatoes", "Onions"],
        "optional_ingredients": ["Spinach", "Tomatoes"],
        "ingredient_summary": "3 Boiled Eggs sliced over 250g warm boiled Potatoes with diced Onions",
        "instructions": "1. Boil potatoes and eggs. 2. Chop potatoes and peel eggs. 3. Toss together with diced onions, salt, pepper, and fresh herbs.",
        "prep_time_min": 15,
        "base_calories": 452.0,
        "base_protein_g": 25.1,
        "base_carbs_g": 54.0,
        "base_fats_g": 14.7,
        "tags": ["Vegetarian", "Post-Workout", "Budget"]
    },

    # --- Snacks ---
    {
        "id": "rec_snack_boiled_eggs",
        "title": "Hard-Boiled Eggs Snack Pack",
        "meal_type": "snack",
        "required_ingredients": ["Eggs"],
        "optional_ingredients": [],
        "ingredient_summary": "2 Hard-Boiled Eggs seasoned with salt and black pepper",
        "instructions": "1. Boil eggs for 8 minutes. 2. Plunge in cold water, peel and slice.",
        "prep_time_min": 10,
        "base_calories": 144.0,
        "base_protein_g": 12.6,
        "base_carbs_g": 0.8,
        "base_fats_g": 9.6,
        "tags": ["High-Protein", "Low-Carb", "Keto", "Portable"]
    },
    {
        "id": "rec_snack_apple_peanut_butter",
        "title": "Crisp Apple Wedges with Peanut Butter",
        "meal_type": "snack",
        "required_ingredients": ["Apples", "Peanut Butter"],
        "optional_ingredients": ["Almonds"],
        "ingredient_summary": "1 sliced Apple dipped in 32g creamy Peanut Butter",
        "instructions": "1. Core and slice apple into wedges. 2. Serve with 2 tbsp peanut butter for dipping.",
        "prep_time_min": 3,
        "base_calories": 283.0,
        "base_protein_g": 8.5,
        "base_carbs_g": 31.0,
        "base_fats_g": 16.3,
        "tags": ["Vegetarian", "Vegan", "Fiber", "Quick"]
    },
    {
        "id": "rec_snack_protein_shake",
        "title": "Whey & Milk Hypertrophy Shake",
        "meal_type": "snack",
        "required_ingredients": ["Whey Protein Powder", "Milk (Cow / Dairy)"],
        "optional_ingredients": ["Bananas", "Peanut Butter"],
        "ingredient_summary": "1 scoop Whey Protein shaken with 250ml cold Milk and optional Banana",
        "instructions": "1. Pour milk into shaker bottle. 2. Add protein powder and shake vigorously for 20 seconds.",
        "prep_time_min": 2,
        "base_calories": 270.0,
        "base_protein_g": 32.0,
        "base_carbs_g": 14.0,
        "base_fats_g": 9.8,
        "tags": ["High-Protein", "Post-Workout", "Rapid"]
    },
    {
        "id": "rec_snack_almonds_banana",
        "title": "Energy Fuel: Banana & Raw Almonds",
        "meal_type": "snack",
        "required_ingredients": ["Bananas", "Almonds"],
        "optional_ingredients": [],
        "ingredient_summary": "1 ripe Banana paired with 30g raw Almonds",
        "instructions": "1. Peel banana and enjoy alongside raw almonds.",
        "prep_time_min": 1,
        "base_calories": 279.0,
        "base_protein_g": 7.6,
        "base_carbs_g": 33.6,
        "base_fats_g": 15.3,
        "tags": ["Clean", "Vegan", "Brain-Food"]
    }
]
