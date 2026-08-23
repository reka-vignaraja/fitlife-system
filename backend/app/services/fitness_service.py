from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException

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


def get_intensity(fitness_level: str, goal: str, bmi_category: str):
    fitness_level = fitness_level.lower()
    goal = goal.lower()

    if bmi_category in ["Overweight", "Obese"] and fitness_level == "beginner":
        return "Low to Moderate"

    if fitness_level == "beginner":
        return "Low"

    if fitness_level == "intermediate":
        if goal in ["weight loss", "muscle gain"]:
            return "Moderate"
        return "Low to Moderate"

    if fitness_level == "advanced":
        return "Moderate to High"

    return "Moderate"


def get_workout_bank(goal: str, equipment: str):
    goal = goal.lower()
    equipment = equipment.lower()

    if equipment == "gym":
        strength = [
            "machine chest press",
            "lat pulldown",
            "leg press",
            "seated row",
            "dumbbell shoulder press",
            "cable triceps pushdown",
            "dumbbell curls",
        ]
    elif equipment == "home":
        strength = [
            "dumbbell squats",
            "resistance band rows",
            "dumbbell shoulder press",
            "glute bridges",
            "plank",
            "wall sit",
            "bodyweight lunges",
        ]
    else:
        strength = [
            "bodyweight squats",
            "push-ups",
            "lunges",
            "glute bridges",
            "plank",
            "wall sit",
            "mountain climbers",
        ]

    cardio = [
        "brisk walking",
        "cycling",
        "jumping jacks",
        "step-ups",
        "light jogging",
        "high knees",
    ]

    flexibility = [
        "full body stretching",
        "yoga flow",
        "hamstring stretch",
        "shoulder mobility",
        "hip mobility",
    ]

    core = [
        "plank",
        "dead bug",
        "crunches",
        "leg raises",
        "bird dog",
    ]

    if goal == "weight loss":
        return {
            "main": cardio + strength,
            "support": core,
            "recovery": flexibility,
        }

    if goal == "muscle gain":
        return {
            "main": strength,
            "support": core,
            "recovery": flexibility,
        }

    if goal == "endurance":
        return {
            "main": cardio,
            "support": strength,
            "recovery": flexibility,
        }

    return {
        "main": strength + cardio,
        "support": core,
        "recovery": flexibility,
    }


def filter_workouts_for_injury(workouts, injuries: str):
    injuries = injuries.lower()

    avoid_keywords = []

    if "knee" in injuries:
        avoid_keywords.extend(["jumping", "lunges", "high knees", "step-ups"])

    if "back" in injuries:
        avoid_keywords.extend(["deadlift", "leg raises", "mountain climbers"])

    if "shoulder" in injuries:
        avoid_keywords.extend(["push-ups", "shoulder press"])

    filtered = []

    for workout in workouts:
        if not any(keyword in workout.lower() for keyword in avoid_keywords):
            filtered.append(workout)

    if not filtered:
        return workouts

    return filtered


def choose_item(items, index):
    return items[index % len(items)]


def estimate_weekly_calories(weight_kg, duration_minutes, workout_days, intensity):
    intensity = intensity.lower()

    if "low" in intensity and "moderate" not in intensity:
        met = 3.5
    elif "high" in intensity:
        met = 7.0
    else:
        met = 5.5

    calories_per_session = (met * 3.5 * weight_kg / 200) * duration_minutes
    weekly_calories = calories_per_session * workout_days

    return round(calories_per_session), round(weekly_calories)


def create_day_note(goal, fitness_level):
    goal = goal.lower()
    fitness_level = fitness_level.lower()

    if fitness_level == "beginner":
        return "Focus on correct posture and do not rush the workout."

    if goal == "weight loss":
        return "Keep rest time short and maintain steady movement."

    if goal == "muscle gain":
        return "Focus on controlled movement and progressive overload."

    if goal == "endurance":
        return "Maintain consistent pace and breathing."

    return "Stay consistent and increase intensity slowly."


def create_weekly_plan(data, intensity):
    workout_bank = get_workout_bank(data.goal, data.equipment)

    main_workouts = filter_workouts_for_injury(
        workout_bank["main"],
        data.injuries or "",
    )

    support_workouts = filter_workouts_for_injury(
        workout_bank["support"],
        data.injuries or "",
    )

    recovery_workouts = workout_bank["recovery"]

    week_days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]

    workout_days = data.workout_days_per_week
    plan = []

    for index, day in enumerate(week_days):
        if index < workout_days:
            main_1 = choose_item(main_workouts, index)
            main_2 = choose_item(main_workouts, index + 1)
            support = choose_item(support_workouts, index)

            plan.append(
                {
                    "day": day,
                    "type": "Workout",
                    "duration_minutes": data.duration_minutes,
                    "intensity": intensity,
                    "warm_up": "5-10 minutes light walking and mobility exercises",
                    "main_workout": [
                        main_1,
                        main_2,
                        support,
                    ],
                    "cool_down": "5 minutes stretching and breathing exercise",
                    "note": create_day_note(data.goal, data.fitness_level),
                }
            )
        else:
            recovery = choose_item(recovery_workouts, index)

            plan.append(
                {
                    "day": day,
                    "type": "Recovery",
                    "duration_minutes": 20,
                    "intensity": "Low",
                    "warm_up": "Light movement",
                    "main_workout": [
                        recovery,
                        "easy walk",
                    ],
                    "cool_down": "Slow breathing",
                    "note": "Recovery day helps muscle repair and reduces injury risk.",
                }
            )

    return plan


def generate_ai_fitness_plan(data, user_id: str):
    db = get_database()

    users_collection = db["users"]
    fitness_collection = db["fitness_plans"]

    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user id")

    user = users_collection.find_one({"_id": user_object_id})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    bmi, bmi_category = calculate_bmi(data.weight_kg, data.height_cm)

    intensity = get_intensity(
        data.fitness_level,
        data.goal,
        bmi_category,
    )

    calories_per_session, weekly_calories = estimate_weekly_calories(
        data.weight_kg,
        data.duration_minutes,
        data.workout_days_per_week,
        intensity,
    )

    weekly_plan = create_weekly_plan(data, intensity)

    recommendations = [
        "Start each workout with warm-up exercises.",
        "Drink enough water before and after exercise.",
        "Take rest days seriously to avoid overtraining.",
        "Increase workout intensity slowly week by week.",
    ]

    if data.goal.lower() == "weight loss":
        recommendations.append(
            "Combine cardio and strength training for better fat loss."
        )

    if data.goal.lower() == "muscle gain":
        recommendations.append(
            "Use progressive overload and eat enough protein daily."
        )

    if data.injuries and data.injuries.lower() not in ["none", "no"]:
        recommendations.append(
            "Injury mentioned. Avoid painful movements and consult a professional if needed."
        )

    if data.health_conditions and data.health_conditions.lower() not in ["none", "no"]:
        recommendations.append(
            "Health condition mentioned. Please consult a doctor before following intense exercise."
        )

    result = {
        "user_id": user_id,
        "user_object_id": user_object_id,
        "age": data.age,
        "gender": data.gender,
        "height_cm": data.height_cm,
        "weight_kg": data.weight_kg,
        "bmi": bmi,
        "bmi_category": bmi_category,
        "goal": data.goal,
        "fitness_goal": data.goal,
        "fitness_level": data.fitness_level,
        "activity_level": data.activity_level,
        "equipment": data.equipment,
        "preferred_workouts": data.preferred_workouts,
        "injuries": data.injuries,
        "health_conditions": data.health_conditions,
        "notes": data.notes,
        "workout_days_per_week": data.workout_days_per_week,
        "workout_days": data.workout_days_per_week,
        "duration_minutes": data.duration_minutes,
        "recommended_intensity": intensity,
        "estimated_calories_per_session": calories_per_session,
        "estimated_weekly_calories": weekly_calories,
        "weekly_plan": weekly_plan,
        "recommendations": recommendations,
        "disclaimer": "This is an AI-generated educational fitness plan. It is not medical advice.",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    insert_data = result.copy()
    insert_result = fitness_collection.insert_one(insert_data)

    result["_id"] = str(insert_result.inserted_id)
    result["user_object_id"] = str(user_object_id)
    result["created_at"] = result["created_at"].isoformat()
    result["updated_at"] = result["updated_at"].isoformat()

    return {
        "message": "AI Fitness Guider plan generated successfully",
        "saved_to_progress_report": True,
        **result,
    }


def serialize_fitness_plan_document(document):
    if isinstance(document, ObjectId):
        return str(document)

    if isinstance(document, datetime):
        return document.isoformat()

    if isinstance(document, list):
        return [serialize_fitness_plan_document(item) for item in document]

    if isinstance(document, dict):
        return {
            key: serialize_fitness_plan_document(value)
            for key, value in document.items()
        }

    return document


def get_latest_fitness_plan(user_id: str):
    db = get_database()

    fitness_collection = db["fitness_plans"]

    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user id")

    latest_plan = fitness_collection.find_one(
        {
            "$or": [
                {"user_id": user_id},
                {"user_object_id": user_object_id},
            ]
        },
        sort=[("created_at", -1), ("updated_at", -1)],
    )

    if not latest_plan:
        return {
            "message": "No fitness plan found",
            "has_plan": False,
            "plan": None,
        }

    latest_plan = serialize_fitness_plan_document(latest_plan)

    return {
        "message": "Latest fitness plan loaded successfully",
        "has_plan": True,
        "plan": latest_plan,
    }