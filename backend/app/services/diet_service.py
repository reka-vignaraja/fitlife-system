from datetime import datetime
from pathlib import Path

import joblib
import pandas as pd

from app.database.mongodb import get_database


BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = BASE_DIR / "app" / "models" / "fitlife_diet_recommendation_model.pkl"


def safe_text(value, default="None"):
    if value is None:
        return default

    value = str(value).strip()

    if value == "":
        return default

    return value


def calculate_bmi(weight_kg: float, height_cm: float):
    if height_cm <= 0:
        raise ValueError("Height must be greater than 0")

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
    gender = safe_text(gender, "female").lower()
    activity_level = safe_text(activity_level, "sedentary").lower()
    goal = safe_text(goal, "maintain weight").lower()

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


def get_food_bank(diet_type):
    diet_type = safe_text(diet_type, "balanced").lower()

    if diet_type == "vegetarian":
        return {
            "protein": [
                "lentils",
                "chickpeas",
                "paneer",
                "tofu",
                "Greek yogurt",
                "beans",
            ],
            "carbs": [
                "brown rice",
                "oats",
                "whole wheat roti",
                "sweet potato",
                "millet",
            ],
            "fats": [
                "nuts",
                "avocado",
                "olive oil",
                "peanut butter",
                "seeds",
            ],
            "vegetables": [
                "spinach",
                "carrot",
                "beans",
                "broccoli",
                "cucumber",
            ],
            "snacks": [
                "fruit bowl",
                "yogurt",
                "nuts",
                "boiled chickpeas",
            ],
        }

    if diet_type == "vegan":
        return {
            "protein": [
                "tofu",
                "lentils",
                "chickpeas",
                "beans",
                "soy chunks",
            ],
            "carbs": [
                "brown rice",
                "oats",
                "quinoa",
                "sweet potato",
                "millet",
            ],
            "fats": [
                "nuts",
                "avocado",
                "olive oil",
                "seeds",
                "peanut butter",
            ],
            "vegetables": [
                "spinach",
                "carrot",
                "beans",
                "broccoli",
                "cabbage",
            ],
            "snacks": [
                "fruit bowl",
                "nuts",
                "roasted chickpeas",
                "smoothie",
            ],
        }

    return {
        "protein": [
            "chicken breast",
            "fish",
            "eggs",
            "Greek yogurt",
            "lean meat",
            "lentils",
        ],
        "carbs": [
            "brown rice",
            "oats",
            "whole wheat bread",
            "sweet potato",
            "red rice",
        ],
        "fats": [
            "nuts",
            "avocado",
            "olive oil",
            "peanut butter",
            "seeds",
        ],
        "vegetables": [
            "spinach",
            "carrot",
            "beans",
            "broccoli",
            "cucumber",
        ],
        "snacks": [
            "boiled eggs",
            "fruit bowl",
            "yogurt",
            "nuts",
        ],
    }


def choose_food(food_list, index):
    return food_list[index % len(food_list)]


def create_portion_guide(goal, meal_name):
    goal = safe_text(goal, "maintain weight").lower()

    if "snack" in meal_name.lower():
        return "Keep this meal light with small portions and avoid sugary foods."

    if goal == "weight loss":
        return "Use more vegetables, moderate protein, and reduce high-calorie carbohydrates."

    if goal == "weight gain":
        return "Increase healthy carbohydrates and add calorie-dense foods like nuts or avocado."

    if goal == "muscle gain":
        return "Prioritize protein with balanced carbohydrates for workout recovery."

    return "Maintain balanced portions with protein, carbohydrates, vegetables, and healthy fats."


def round_to_nearest_5(value):
    return int(round(value / 5) * 5)


def clamp(value, minimum, maximum):
    return max(minimum, min(value, maximum))


def get_food_group(food_name):
    food = safe_text(food_name, "").lower()

    protein_keywords = [
        "chicken",
        "fish",
        "egg",
        "eggs",
        "meat",
        "lentils",
        "chickpeas",
        "paneer",
        "tofu",
        "greek yogurt",
        "yogurt",
        "beans",
        "soy chunks",
    ]

    carb_keywords = [
        "rice",
        "brown rice",
        "red rice",
        "oats",
        "roti",
        "bread",
        "sweet potato",
        "potato",
        "millet",
        "quinoa",
        "pasta",
    ]

    fat_keywords = [
        "nuts",
        "avocado",
        "olive oil",
        "peanut butter",
        "seeds",
    ]

    vegetable_keywords = [
        "spinach",
        "carrot",
        "broccoli",
        "cucumber",
        "cabbage",
        "vegetables",
        "salad",
    ]

    fruit_keywords = [
        "fruit",
        "apple",
        "banana",
        "orange",
        "berries",
        "smoothie",
    ]

    if any(keyword in food for keyword in protein_keywords):
        return "protein"

    if any(keyword in food for keyword in carb_keywords):
        return "carbs"

    if any(keyword in food for keyword in fat_keywords):
        return "fats"

    if any(keyword in food for keyword in vegetable_keywords):
        return "vegetables"

    if any(keyword in food for keyword in fruit_keywords):
        return "fruit"

    return "general"


def estimate_food_grams(food_name, meal_calories, goal, meal_name):
    food_group = get_food_group(food_name)

    goal = safe_text(goal, "maintenance").lower()
    meal_name = safe_text(meal_name, "").lower()

    is_snack = "snack" in meal_name

    base_grams = {
        "protein": 120,
        "carbs": 150,
        "vegetables": 90,
        "fats": 20,
        "fruit": 120,
        "general": 100,
    }

    min_max_grams = {
        "protein": (70, 220),
        "carbs": (70, 260),
        "vegetables": (50, 220),
        "fats": (10, 45),
        "fruit": (70, 180),
        "general": (50, 180),
    }

    baseline_calories = 250 if is_snack else 500
    calorie_factor = meal_calories / baseline_calories
    calorie_factor = clamp(calorie_factor, 0.65, 1.45)

    goal_factor = 1.0

    if goal == "weight loss":
        if food_group == "protein":
            goal_factor = 1.05
        elif food_group == "carbs":
            goal_factor = 0.85
        elif food_group == "vegetables":
            goal_factor = 1.15
        elif food_group == "fats":
            goal_factor = 0.85

    elif goal == "weight gain":
        if food_group == "protein":
            goal_factor = 1.10
        elif food_group == "carbs":
            goal_factor = 1.15
        elif food_group == "fats":
            goal_factor = 1.15

    elif goal == "muscle gain":
        if food_group == "protein":
            goal_factor = 1.25
        elif food_group == "carbs":
            goal_factor = 1.10
        elif food_group == "fats":
            goal_factor = 1.00

    grams = base_grams.get(food_group, 100) * calorie_factor * goal_factor

    minimum, maximum = min_max_grams.get(food_group, (50, 180))
    grams = clamp(grams, minimum, maximum)

    return round_to_nearest_5(grams)


def build_food_items(foods, meal_calories, goal, meal_name):
    return [
        {
            "name": food,
            "grams": estimate_food_grams(food, meal_calories, goal, meal_name),
        }
        for food in foods
    ]


def generate_meal_chart(food_bank, calories, goal, meals_per_day, allergies, food_avoid):
    avoid_text = f"{safe_text(allergies, '')} {safe_text(food_avoid, '')}".lower()

    def safe_food(items, index):
        filtered = [item for item in items if item.lower() not in avoid_text]

        if not filtered:
            filtered = items

        return choose_food(filtered, index)

    meal_distribution = {
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

    try:
        meals_per_day = int(meals_per_day)
    except Exception:
        meals_per_day = 3

    if meals_per_day not in meal_distribution:
        meals_per_day = 3

    meals = []

    for index, meal in enumerate(meal_distribution[meals_per_day]):
        meal_name, percentage = meal
        meal_calories = round(calories * percentage)

        if "snack" in meal_name.lower():
            foods = [
                safe_food(food_bank["snacks"], index),
                safe_food(food_bank["fats"], index),
            ]
        else:
            foods = [
                safe_food(food_bank["protein"], index),
                safe_food(food_bank["carbs"], index),
                safe_food(food_bank["vegetables"], index),
                safe_food(food_bank["fats"], index),
            ]

        meals.append(
            {
                "meal": meal_name,
                "target_calories": meal_calories,
                "foods": foods,
                "food_items": build_food_items(
                    foods,
                    meal_calories,
                    goal,
                    meal_name,
                ),
                "portion_guide": create_portion_guide(goal, meal_name),
            }
        )

    return meals


def load_diet_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Diet recommendation model not found: {MODEL_PATH}")

    saved_model = joblib.load(MODEL_PATH)

    if isinstance(saved_model, dict):
        pipeline = saved_model.get("pipeline")
        metadata = saved_model
    else:
        pipeline = saved_model
        metadata = {}

    if pipeline is None:
        raise ValueError("Diet model pipeline not found.")

    return pipeline, metadata


def map_activity_to_exercise_hours(activity_level: str):
    activity = safe_text(activity_level, "moderate").lower()

    if activity == "sedentary":
        return 0
    if activity == "light":
        return 2
    if activity == "moderate":
        return 4
    if activity == "active":
        return 6
    if activity == "very active":
        return 8

    return 3


def estimate_nutrient_imbalance_score(bmi_category: str, goal: str):
    goal = safe_text(goal, "maintain weight").lower()

    if bmi_category in ["Underweight", "Obese"]:
        return 60
    if bmi_category == "Overweight":
        return 45
    if goal in ["weight loss", "weight gain", "muscle gain"]:
        return 35

    return 25


def get_model_guidance(diet_recommendation: str):
    if diet_recommendation == "Low_Carb":
        return [
            "The machine learning model suggests a low-carbohydrate diet pattern.",
            "Reduce refined carbohydrates such as white rice, white bread, sweets, and sugary drinks.",
            "Increase lean protein, vegetables, and healthy fats.",
        ]

    if diet_recommendation == "Low_Sodium":
        return [
            "The machine learning model suggests a low-sodium diet pattern.",
            "Reduce salty foods, processed foods, fast food, and high-salt sauces.",
            "Use herbs and spices instead of adding extra salt.",
        ]

    return [
        "The machine learning model suggests a balanced diet pattern.",
        "Maintain balanced portions of protein, carbohydrates, vegetables, and healthy fats.",
        "Avoid excessive sugar, fried foods, and processed foods.",
    ]


def predict_diet_recommendation(data, bmi, calories, bmi_category):
    pipeline, metadata = load_diet_model()

    health_conditions = safe_text(getattr(data, "health_conditions", "None"), "None")
    allergies = safe_text(getattr(data, "allergies", "None"), "None")
    diet_type = safe_text(getattr(data, "diet_type", "balanced"), "balanced")

    disease_type = safe_text(getattr(data, "disease_type", None), "")
    if disease_type == "":
        disease_type = (
            health_conditions
            if health_conditions.lower() != "none"
            else "None"
        )

    severity = safe_text(getattr(data, "severity", None), "None")

    physical_activity_level = safe_text(
        getattr(data, "physical_activity_level", None),
        safe_text(getattr(data, "activity_level", "moderate"), "moderate"),
    )

    daily_caloric_intake = getattr(data, "daily_caloric_intake", None)
    if daily_caloric_intake is None:
        daily_caloric_intake = calories

    cholesterol = getattr(data, "cholesterol_mg_dl", None)
    if cholesterol is None:
        cholesterol = 180

    blood_pressure = getattr(data, "blood_pressure_mmhg", None)
    if blood_pressure is None:
        blood_pressure = 120

    glucose = getattr(data, "glucose_mg_dl", None)
    if glucose is None:
        glucose = 90

    dietary_restrictions = safe_text(
        getattr(data, "dietary_restrictions", None),
        diet_type,
    )

    preferred_cuisine = safe_text(
        getattr(data, "preferred_cuisine", None),
        "Any",
    )

    weekly_exercise_hours = getattr(data, "weekly_exercise_hours", None)
    if weekly_exercise_hours is None:
        weekly_exercise_hours = map_activity_to_exercise_hours(physical_activity_level)

    adherence_to_diet_plan = getattr(data, "adherence_to_diet_plan", None)
    if adherence_to_diet_plan is None:
        adherence_to_diet_plan = 70

    nutrient_imbalance_score = getattr(
        data,
        "dietary_nutrient_imbalance_score",
        None,
    )
    if nutrient_imbalance_score is None:
        nutrient_imbalance_score = estimate_nutrient_imbalance_score(
            bmi_category,
            getattr(data, "goal", "maintain weight"),
        )

    model_input = pd.DataFrame(
        [
            {
                "Age": data.age,
                "Gender": data.gender,
                "Weight_kg": data.weight_kg,
                "Height_cm": data.height_cm,
                "BMI": bmi,
                "Disease_Type": disease_type,
                "Severity": severity,
                "Physical_Activity_Level": physical_activity_level,
                "Daily_Caloric_Intake": daily_caloric_intake,
                "Cholesterol_mg/dL": cholesterol,
                "Blood_Pressure_mmHg": blood_pressure,
                "Glucose_mg/dL": glucose,
                "Dietary_Restrictions": dietary_restrictions,
                "Allergies": allergies,
                "Preferred_Cuisine": preferred_cuisine,
                "Weekly_Exercise_Hours": weekly_exercise_hours,
                "Adherence_to_Diet_Plan": adherence_to_diet_plan,
                "Dietary_Nutrient_Imbalance_Score": nutrient_imbalance_score,
            }
        ]
    )

    prediction = pipeline.predict(model_input)[0]

    confidence = None
    probabilities = None

    if hasattr(pipeline, "predict_proba"):
        proba = pipeline.predict_proba(model_input)[0]
        classes = pipeline.named_steps["model"].classes_

        probabilities = {
            str(classes[i]): round(float(proba[i]) * 100, 2)
            for i in range(len(classes))
        }

        confidence = round(float(max(proba)) * 100, 2)

    model_inputs_used = {
        "Disease_Type": disease_type,
        "Severity": severity,
        "Physical_Activity_Level": physical_activity_level,
        "Daily_Caloric_Intake": daily_caloric_intake,
        "Cholesterol_mg/dL": cholesterol,
        "Blood_Pressure_mmHg": blood_pressure,
        "Glucose_mg/dL": glucose,
        "Dietary_Restrictions": dietary_restrictions,
        "Allergies": allergies,
        "Preferred_Cuisine": preferred_cuisine,
        "Weekly_Exercise_Hours": weekly_exercise_hours,
        "Adherence_to_Diet_Plan": adherence_to_diet_plan,
        "Dietary_Nutrient_Imbalance_Score": nutrient_imbalance_score,
    }

    return str(prediction), confidence, probabilities, metadata, model_inputs_used


def generate_ai_diet_plan(data, user_id=None):
    db = get_database()

    diet_collection = db["diet_plans"]
    user_dataset_collection = db["user_generated_dataset"]

    bmi, bmi_category = calculate_bmi(
        float(data.weight_kg),
        float(data.height_cm),
    )

    calories = calculate_calories(
        int(data.age),
        data.gender,
        float(data.height_cm),
        float(data.weight_kg),
        data.activity_level,
        data.goal,
    )

    food_bank = get_food_bank(data.diet_type)

    meal_chart = generate_meal_chart(
        food_bank,
        calories,
        data.goal,
        data.meals_per_day,
        getattr(data, "allergies", "") or "",
        getattr(data, "food_avoid", "") or "",
    )

    protein = round((calories * 0.25) / 4)
    carbs = round((calories * 0.50) / 4)
    fats = round((calories * 0.25) / 9)

    (
        diet_recommendation,
        confidence,
        probabilities,
        metadata,
        model_inputs_used,
    ) = predict_diet_recommendation(
        data,
        bmi,
        calories,
        bmi_category,
    )

    recommendations = [
        "Drink enough water throughout the day.",
        "Avoid highly processed and sugary foods.",
        "Try to eat meals at regular times.",
        "Combine this diet plan with suitable exercise.",
    ]

    recommendations.extend(get_model_guidance(diet_recommendation))

    goal = safe_text(getattr(data, "goal", ""), "").lower()

    if goal == "weight loss":
        recommendations.append(
            "Maintain a small calorie deficit and focus on high-fiber foods."
        )

    if goal == "muscle gain":
        recommendations.append(
            "Include protein in every main meal and follow strength training."
        )

    if goal == "weight gain":
        recommendations.append(
            "Increase calories gradually using healthy carbohydrates, protein, and healthy fats."
        )

    health_conditions = safe_text(
        getattr(data, "health_conditions", "None"),
        "None",
    )

    if health_conditions.lower() != "none":
        recommendations.append(
            "Health condition mentioned. Please consult a doctor or dietitian before following this plan."
        )

    recommendations.append(
        "Food gram values are estimated dynamically based on calorie target, meal type, goal, and food category."
    )

    created_at = datetime.utcnow()
    final_user_id = user_id or getattr(data, "user_id", None)

    result = {
        "user_id": final_user_id,
        "bmi": bmi,
        "bmi_category": bmi_category,
        "daily_calorie_target": calories,
        "macros": {
            "protein_g": protein,
            "carbs_g": carbs,
            "fats_g": fats,
        },
        "goal": data.goal,
        "diet_type": data.diet_type,
        "meals_per_day": data.meals_per_day,
        "meal_chart": meal_chart,
        "diet_recommendation": diet_recommendation,
        "confidence": confidence,
        "probabilities": probabilities,
        "model_inputs_used": model_inputs_used,
        "model_name": metadata.get(
            "model_name",
            "FitLife Diet Recommendation Model",
        ),
        "model_version": "1.0.0",
        "algorithm_type": metadata.get(
            "best_algorithm",
            "Logistic Regression",
        ),
        "model_accuracy": round(float(metadata.get("accuracy", 0)) * 100, 2),
        "recommendations": recommendations,
        "disclaimer": "This is an AI-generated educational diet plan. It is not medical advice.",
        "created_at": created_at,
    }

    insert_result = diet_collection.insert_one(result.copy())

    user_dataset_collection.insert_one(
        {
            "user_id": final_user_id,
            "module": "Diet Recommendation",
            "input": {
                "age": data.age,
                "gender": data.gender,
                "height_cm": data.height_cm,
                "weight_kg": data.weight_kg,
                "activity_level": data.activity_level,
                "goal": data.goal,
                "diet_type": data.diet_type,
                "meals_per_day": data.meals_per_day,
                "allergies": getattr(data, "allergies", "None"),
                "food_avoid": getattr(data, "food_avoid", "None"),
                "health_conditions": getattr(data, "health_conditions", "None"),
                "bmi": bmi,
                "daily_calorie_target": calories,
                "advanced_model_inputs": model_inputs_used,
            },
            "prediction": {
                "diet_recommendation": diet_recommendation,
                "confidence": confidence,
                "probabilities": probabilities,
            },
            "meal_chart": meal_chart,
            "model_name": metadata.get(
                "model_name",
                "FitLife Diet Recommendation Model",
            ),
            "model_version": "1.0.0",
            "algorithm_type": metadata.get(
                "best_algorithm",
                "Logistic Regression",
            ),
            "created_at": created_at,
        }
    )

    result["_id"] = str(insert_result.inserted_id)
    result["created_at"] = created_at.isoformat()

    return result