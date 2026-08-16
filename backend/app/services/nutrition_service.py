from datetime import datetime
from app.database.mongodb import get_database


def calculate_bmi(weight_kg: float, height_cm: float):
    height_m = height_cm / 100
    bmi = weight_kg / (height_m * height_m)

    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25:
        category = "Normal"
    elif bmi < 30:
        category = "Overweight"
    else:
        category = "Obese"

    return round(bmi, 2), category


def calculate_calories(age, gender, height_cm, weight_kg, activity_level, goal):
    gender = gender.lower()
    activity_level = activity_level.lower()
    goal = goal.lower()

    if gender == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    activity_multiplier = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very active": 1.9,
    }

    calories = bmr * activity_multiplier.get(activity_level, 1.2)

    if goal == "weight loss":
        calories -= 400
    elif goal == "weight gain":
        calories += 400
    elif goal == "muscle gain":
        calories += 300

    return max(round(calories), 1200)


def calculate_macros(calories, goal):
    goal = goal.lower()

    if goal == "weight loss":
        protein_ratio = 0.30
        carbs_ratio = 0.40
        fats_ratio = 0.30
    elif goal == "muscle gain":
        protein_ratio = 0.30
        carbs_ratio = 0.45
        fats_ratio = 0.25
    elif goal == "weight gain":
        protein_ratio = 0.25
        carbs_ratio = 0.50
        fats_ratio = 0.25
    else:
        protein_ratio = 0.25
        carbs_ratio = 0.50
        fats_ratio = 0.25

    return {
        "protein_g": round((calories * protein_ratio) / 4),
        "carbs_g": round((calories * carbs_ratio) / 4),
        "fats_g": round((calories * fats_ratio) / 9),
    }


def calculate_water_target(weight_kg, activity_level):
    water = weight_kg * 0.035

    if activity_level.lower() in ["active", "very active"]:
        water += 0.5

    return round(water, 1)


def get_food_bank(diet_type):
    diet_type = diet_type.lower()

    if diet_type == "vegetarian":
        return {
            "protein": ["lentils", "chickpeas", "paneer", "tofu", "beans"],
            "carbs": ["brown rice", "oats", "whole wheat roti", "sweet potato"],
            "fiber": ["spinach", "broccoli", "carrot", "cucumber"],
            "fats": ["nuts", "avocado", "olive oil", "seeds"],
            "snacks": ["fruit bowl", "yogurt", "nuts", "boiled chickpeas"],
        }

    if diet_type == "vegan":
        return {
            "protein": ["tofu", "lentils", "chickpeas", "soy chunks", "beans"],
            "carbs": ["brown rice", "oats", "quinoa", "sweet potato"],
            "fiber": ["spinach", "broccoli", "carrot", "cucumber"],
            "fats": ["nuts", "avocado", "olive oil", "seeds"],
            "snacks": ["fruit bowl", "roasted chickpeas", "nuts", "smoothie"],
        }

    return {
        "protein": ["chicken breast", "fish", "eggs", "Greek yogurt", "lentils"],
        "carbs": ["brown rice", "oats", "whole wheat bread", "sweet potato"],
        "fiber": ["spinach", "broccoli", "carrot", "cucumber"],
        "fats": ["nuts", "avocado", "olive oil", "seeds"],
        "snacks": ["boiled eggs", "fruit bowl", "yogurt", "nuts"],
    }


def choose_item(items, index):
    return items[index % len(items)]


def safe_choose(items, index, allergies, food_avoid):
    avoid_text = f"{allergies} {food_avoid}".lower()

    filtered = []
    for item in items:
        if item.lower() not in avoid_text:
            filtered.append(item)

    if len(filtered) == 0:
        filtered = items

    return choose_item(filtered, index)


def get_meal_distribution(meals_per_day):
    distributions = {
        3: [
            ("Breakfast", 0.30),
            ("Lunch", 0.40),
            ("Dinner", 0.30),
        ],
        4: [
            ("Breakfast", 0.25),
            ("Lunch", 0.35),
            ("Evening Snack", 0.15),
            ("Dinner", 0.25),
        ],
        5: [
            ("Breakfast", 0.22),
            ("Mid-Morning Snack", 0.10),
            ("Lunch", 0.32),
            ("Evening Snack", 0.12),
            ("Dinner", 0.24),
        ],
        6: [
            ("Breakfast", 0.20),
            ("Mid-Morning Snack", 0.10),
            ("Lunch", 0.30),
            ("Evening Snack", 0.10),
            ("Dinner", 0.22),
            ("Night Snack", 0.08),
        ],
    }

    return distributions.get(meals_per_day, distributions[4])


def create_nutrition_chart(data, calories, macros):
    food_bank = get_food_bank(data.diet_type)
    distribution = get_meal_distribution(data.meals_per_day)

    chart = []

    for index, meal_data in enumerate(distribution):
        meal_name, percentage = meal_data

        meal_calories = round(calories * percentage)
        protein = round(macros["protein_g"] * percentage)
        carbs = round(macros["carbs_g"] * percentage)
        fats = round(macros["fats_g"] * percentage)

        if "snack" in meal_name.lower():
            foods = [
                safe_choose(food_bank["snacks"], index, data.allergies or "", data.food_avoid or ""),
                safe_choose(food_bank["fats"], index, data.allergies or "", data.food_avoid or ""),
            ]
            note = "Choose light snacks with protein or fiber. Avoid sugary snacks."
        else:
            foods = [
                safe_choose(food_bank["protein"], index, data.allergies or "", data.food_avoid or ""),
                safe_choose(food_bank["carbs"], index, data.allergies or "", data.food_avoid or ""),
                safe_choose(food_bank["fiber"], index, data.allergies or "", data.food_avoid or ""),
                safe_choose(food_bank["fats"], index, data.allergies or "", data.food_avoid or ""),
            ]
            note = "Maintain balanced portions with protein, carbohydrates, fiber, and healthy fats."

        chart.append({
            "meal": meal_name,
            "target_calories": meal_calories,
            "protein_g": protein,
            "carbs_g": carbs,
            "fats_g": fats,
            "recommended_foods": foods,
            "nutrition_note": note,
        })

    return chart


def calculate_nutrition_score(water_intake, water_target, daily_food_notes):
    score = 70
    notes = daily_food_notes.lower()

    if water_intake >= water_target:
        score += 10
    elif water_intake < water_target * 0.6:
        score -= 10

    if "sugar" in notes or "soft drink" in notes or "fried" in notes:
        score -= 10

    if "vegetable" in notes or "fruit" in notes or "salad" in notes:
        score += 10

    return max(min(score, 100), 0)


def generate_ai_nutrition_plan(data):
    db = get_database()
    nutrition_collection = db["nutrition_plans"]

    bmi, bmi_category = calculate_bmi(data.weight_kg, data.height_cm)

    calories = calculate_calories(
        data.age,
        data.gender,
        data.height_cm,
        data.weight_kg,
        data.activity_level,
        data.goal,
    )

    macros = calculate_macros(calories, data.goal)

    water_target = calculate_water_target(
        data.weight_kg,
        data.activity_level,
    )

    nutrition_chart = create_nutrition_chart(
        data,
        calories,
        macros,
    )

    nutrition_score = calculate_nutrition_score(
        data.water_intake_liters,
        water_target,
        data.daily_food_notes or "",
    )

    fiber_target_g = 25 if data.gender.lower() == "female" else 30
    sugar_limit_g = 30
    sodium_limit_mg = 2300

    recommendations = [
        "Include vegetables or fruits in at least two meals daily.",
        "Choose whole grains instead of refined carbohydrates.",
        "Avoid frequent sugary drinks and highly processed foods.",
        "Maintain consistent water intake throughout the day.",
    ]

    if data.water_intake_liters < water_target:
        recommendations.append(
            f"Increase water intake. Your target is around {water_target} liters per day."
        )

    if data.goal.lower() == "weight loss":
        recommendations.append(
            "For weight loss, keep calories controlled and increase fiber-rich foods."
        )

    if data.goal.lower() == "muscle gain":
        recommendations.append(
            "For muscle gain, include protein in every main meal."
        )

    if data.health_conditions:
        recommendations.append(
            "Health condition mentioned. Please consult a doctor or dietitian before following nutrition changes."
        )

    result = {
        "bmi": bmi,
        "bmi_category": bmi_category,
        "goal": data.goal,
        "diet_type": data.diet_type,
        "daily_calorie_target": calories,
        "daily_macro_targets": macros,
        "water_target_liters": water_target,
        "current_water_intake_liters": data.water_intake_liters,
        "fiber_target_g": fiber_target_g,
        "sugar_limit_g": sugar_limit_g,
        "sodium_limit_mg": sodium_limit_mg,
        "nutrition_score": nutrition_score,
        "nutrition_chart": nutrition_chart,
        "recommendations": recommendations,
        "disclaimer": "This is an AI-generated educational nutrition plan. It is not medical advice.",
        "created_at": datetime.utcnow(),
    }

    insert_result = nutrition_collection.insert_one(result.copy())

    result["_id"] = str(insert_result.inserted_id)
    result["created_at"] = result["created_at"].isoformat()

    return result