from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings
from app.database.mongodb import get_database


router = APIRouter(
    prefix="/api/progress-report",
    tags=["Progress Report"],
)

security = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        token = credentials.credentials

        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        return user_id

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_possible_user_ids(user_id: str):
    possible_ids = [user_id]

    try:
        possible_ids.append(ObjectId(user_id))
    except Exception:
        pass

    return possible_ids


def find_latest(collection, user_id: str):
    possible_ids = get_possible_user_ids(user_id)

    query = {
        "$or": [
            {"user_id": {"$in": possible_ids}},
            {"user_object_id": {"$in": possible_ids}},
        ]
    }

    return collection.find_one(
        query,
        sort=[("created_at", -1)],
    )


def calculate_bmi(height_cm, weight_kg):
    try:
        height_m = float(height_cm) / 100
        weight = float(weight_kg)

        if height_m <= 0 or weight <= 0:
            return None

        return round(weight / (height_m * height_m), 1)

    except Exception:
        return None


def get_bmi_category(bmi):
    if bmi is None:
        return "Not available"

    if bmi < 18.5:
        return "Underweight"

    if bmi < 25:
        return "Normal"

    if bmi < 30:
        return "Overweight"

    return "Obese"


def normalize_health_risk(value):
    if not value:
        return "Not calculated"

    value = str(value).strip()

    if value.lower() in ["low", "low risk"]:
        return "Low Risk"

    if value.lower() in ["medium", "medium risk", "moderate"]:
        return "Medium Risk"

    if value.lower() in ["high", "high risk"]:
        return "High Risk"

    return value


def normalize_score_label(value, default_value="Moderate"):
    if value is None:
        return default_value

    try:
        numeric_value = float(value)

        if numeric_value >= 75:
            return "Good"

        if numeric_value >= 50:
            return "Moderate"

        return "Poor"

    except Exception:
        value_text = str(value).strip()

        if value_text:
            return value_text

        return default_value


def calculate_goal_progress(goal_record):
    if not goal_record:
        return 0

    saved_progress = (
        goal_record.get("progress_percentage")
        or goal_record.get("progress")
        or goal_record.get("completion_percentage")
    )

    if saved_progress is not None:
        try:
            return max(0, min(round(float(saved_progress), 1), 100))
        except Exception:
            pass

    current_value = (
        goal_record.get("current_value")
        or goal_record.get("current")
        or goal_record.get("latest_value")
    )

    target_value = (
        goal_record.get("target_value")
        or goal_record.get("target")
        or goal_record.get("goal_value")
    )

    start_value = (
        goal_record.get("start_value")
        or goal_record.get("starting_value")
        or goal_record.get("initial_value")
        or goal_record.get("original_value")
    )

    category = str(goal_record.get("category", "")).lower()

    try:
        current_value = float(current_value)
        target_value = float(target_value)

        if start_value is None:
            return 0

        start_value = float(start_value)

        if start_value == target_value:
            return 100

        if "weight loss" in category or target_value < start_value:
            progress = ((start_value - current_value) / (start_value - target_value)) * 100
        else:
            progress = ((current_value - start_value) / (target_value - start_value)) * 100

        return max(0, min(round(progress, 1), 100))

    except Exception:
        return 0


def calculate_overall_score(
    bmi_category,
    health_risk,
    nutrition_score,
    sleep_score,
    goal_progress,
    diet_recommendation,
):
    score = 0

    if bmi_category == "Normal":
        score += 22
    else:
        score += 14

    if health_risk == "Low Risk":
        score += 22
    elif health_risk == "Medium Risk":
        score += 14
    elif health_risk == "High Risk":
        score += 8
    else:
        score += 10

    if nutrition_score == "Good":
        score += 16
    elif nutrition_score == "Moderate":
        score += 10
    else:
        score += 6

    if sleep_score == "Good":
        score += 14
    elif sleep_score == "Moderate":
        score += 9
    else:
        score += 5

    if diet_recommendation and diet_recommendation != "Not generated":
        score += 12
    else:
        score += 6

    score += round(float(goal_progress) * 0.14)

    return min(round(score), 100)


def build_recommendations(
    bmi_category,
    health_risk,
    nutrition_score,
    sleep_score,
    diet_recommendation,
):
    recommendations = []

    if bmi_category != "Normal":
        recommendations.append(
            "Maintain a balanced diet and regular physical activity to improve BMI status."
        )

    if health_risk in ["Medium Risk", "High Risk"]:
        recommendations.append(
            "Monitor health indicators regularly and follow safe workout intensity."
        )

    if nutrition_score != "Good":
        recommendations.append(
            "Improve daily nutrition by increasing balanced meals and reducing unhealthy food choices."
        )

    if sleep_score != "Good":
        recommendations.append(
            "Improve sleep routine by maintaining consistent sleep and wake-up time."
        )

    if diet_recommendation == "Low_Sodium":
        recommendations.append(
            "Follow the diet recommendation by reducing salty and highly processed foods."
        )

    elif diet_recommendation == "Low_Carb":
        recommendations.append(
            "Follow the diet recommendation by reducing refined carbohydrates and increasing lean protein."
        )

    elif diet_recommendation == "Balanced":
        recommendations.append(
            "Continue following a balanced diet with suitable portions of protein, carbohydrates, vegetables, and healthy fats."
        )

    recommendations.append(
        "Continue tracking your fitness goals and review your progress weekly."
    )

    return recommendations


def clean_datetime(value):
    if isinstance(value, datetime):
        return value.isoformat()

    return value


@router.get("/summary")
def get_progress_report(user_id: str = Depends(get_current_user_id)):
    db = get_database()

    users_collection = db["users"]

    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user id")

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    bmi_record = find_latest(db["bmi_records"], user_id)
    health_record = find_latest(db["health_risk_predictions"], user_id)
    nutrition_record = find_latest(db["nutrition_logs"], user_id)
    sleep_record = find_latest(db["sleep_records"], user_id)
    goal_record = find_latest(db["goals"], user_id)
    fitness_record = find_latest(db["fitness_plans"], user_id)
    diet_record = find_latest(db["diet_plans"], user_id)
    sleep_progress_record = find_latest(db["sleep_progress"], user_id)

    height_cm = user.get("height_cm")
    weight_kg = user.get("weight_kg")

    if bmi_record:
        bmi_value = bmi_record.get("bmi") or bmi_record.get("bmi_value")
        bmi_category = (
            bmi_record.get("category")
            or bmi_record.get("bmi_category")
            or get_bmi_category(bmi_value)
        )
    else:
        bmi_value = calculate_bmi(height_cm, weight_kg)
        bmi_category = get_bmi_category(bmi_value)

    if not bmi_category:
        bmi_category = get_bmi_category(bmi_value)

    health_risk = "Not calculated"

    if health_record:
        health_risk = normalize_health_risk(
            health_record.get("risk_level")
            or health_record.get("predicted_risk_level")
            or health_record.get("prediction")
            or health_record.get("health_risk")
        )

    nutrition_score = "Moderate"

    if nutrition_record:
        raw_nutrition_score = (
            nutrition_record.get("nutrition_score")
            or nutrition_record.get("score")
            or nutrition_record.get("nutrition_status")
        )

        nutrition_score = normalize_score_label(raw_nutrition_score, "Good")

    sleep_score = "Moderate"

    if sleep_record:
        raw_sleep_score = (
            sleep_record.get("sleep_score")
            or sleep_record.get("sleep_quality_score")
            or sleep_record.get("score")
        )

        sleep_status = (
            sleep_record.get("sleep_quality_status")
            or sleep_record.get("sleep_status")
            or sleep_record.get("predicted_sleep_risk")
        )

        if raw_sleep_score is not None:
            sleep_score = normalize_score_label(raw_sleep_score, "Moderate")
        elif sleep_status:
            sleep_score = normalize_score_label(sleep_status, "Moderate")

    goal_progress = calculate_goal_progress(goal_record)

    activity_level = (
        user.get("activity_level")
        or user.get("activity")
        or user.get("physical_activity_level")
        or "Not set"
    )

    fitness_goal = user.get("fitness_goal", "Not set")
    fitness_level = user.get("fitness_level", "Not set")
    workout_days = user.get("workout_days", "Not set")

    if fitness_record:
        fitness_goal = (
            fitness_record.get("fitness_goal")
            or fitness_record.get("goal")
            or fitness_goal
        )

        fitness_level = (
            fitness_record.get("fitness_level")
            or fitness_record.get("level")
            or fitness_level
        )

        workout_days = (
            fitness_record.get("workout_days")
            or fitness_record.get("workout_days_per_week")
            or fitness_record.get("days_per_week")
            or workout_days
        )

        activity_level = (
            fitness_record.get("activity_level")
            or fitness_record.get("physical_activity_level")
            or activity_level
        )

    diet_recommendation = "Not generated"
    diet_confidence = None
    diet_model_accuracy = None
    diet_algorithm = "Not available"
    diet_daily_calories = "Not set"
    diet_type = user.get("diet_preference", "Not set")
    diet_meals_per_day = "Not set"
    diet_created_at = None

    if diet_record:
        diet_recommendation = (
            diet_record.get("diet_recommendation")
            or diet_record.get("recommendation")
            or "Not generated"
        )

        diet_confidence = diet_record.get("confidence")
        diet_model_accuracy = diet_record.get("model_accuracy")
        diet_algorithm = diet_record.get("algorithm_type", "Not available")
        diet_daily_calories = diet_record.get("daily_calorie_target", "Not set")
        diet_type = diet_record.get("diet_type") or diet_type
        diet_meals_per_day = diet_record.get("meals_per_day", "Not set")
        diet_created_at = clean_datetime(diet_record.get("created_at"))

    overall_score = calculate_overall_score(
        bmi_category,
        health_risk,
        nutrition_score,
        sleep_score,
        goal_progress,
        diet_recommendation,
    )

    recommendations = build_recommendations(
        bmi_category,
        health_risk,
        nutrition_score,
        sleep_score,
        diet_recommendation,
    )

    goal_details = {
        "title": "Not set",
        "category": "Not set",
        "target_value": "Not set",
        "current_value": "Not set",
        "unit": "",
        "deadline": "Not set",
        "priority": "Not set",
    }

    if goal_record:
        goal_details = {
            "title": goal_record.get("title") or goal_record.get("goal_title") or "Not set",
            "category": goal_record.get("category") or "Not set",
            "target_value": goal_record.get("target_value") or "Not set",
            "current_value": goal_record.get("current_value") or "Not set",
            "unit": goal_record.get("unit") or "",
            "deadline": str(goal_record.get("deadline") or "Not set"),
            "priority": goal_record.get("priority") or "Not set",
        }


    sleep_progress_details = {
        "has_weekly_progress": False,
        "week_start_date": "Not saved",
        "average_sleep_hours": 0,
        "sleep_debt_hours": 0,
        "consistency_score": 0,
        "good_sleep_days": 0,
        "poor_sleep_days": 0,
        "interrupted_days": 0,
        "improvement_status": "Not saved",
        "next_week_goal": "Save weekly sleep progress to generate a next-week sleep goal.",
        "next_week_recommendation": "Weekly sleep progress is not available yet.",
        "weekly_feedback": "",
        "daily_sleep": [],
        "created_at": None,
    }

    if sleep_progress_record:
        sleep_progress_summary = sleep_progress_record.get("summary", {}) or {}

        daily_sleep_items = []

        for item in sleep_progress_record.get("daily_sleep", []):
            daily_sleep_items.append(
                {
                    "date": item.get("date", ""),
                    "day": item.get("day", ""),
                    "sleep_hours": item.get("sleep_hours", 0),
                    "sleep_quality": item.get("sleep_quality", "average"),
                    "bedtime": item.get("bedtime", ""),
                    "wake_time": item.get("wake_time", ""),
                    "interruptions": item.get("interruptions", 0),
                    "stress_level": item.get("stress_level", "moderate"),
                    "mood": item.get("mood", "normal"),
                }
            )

        sleep_progress_details = {
            "has_weekly_progress": True,
            "week_start_date": sleep_progress_record.get("week_start_date") or "Not saved",
            "average_sleep_hours": sleep_progress_summary.get("average_sleep_hours", 0),
            "sleep_debt_hours": sleep_progress_summary.get("sleep_debt_hours", 0),
            "consistency_score": sleep_progress_summary.get("consistency_score", 0),
            "good_sleep_days": sleep_progress_summary.get("good_sleep_days", 0),
            "poor_sleep_days": sleep_progress_summary.get("poor_sleep_days", 0),
            "interrupted_days": sleep_progress_summary.get("interrupted_days", 0),
            "improvement_status": sleep_progress_summary.get("improvement_status", "Not saved"),
            "next_week_goal": sleep_progress_summary.get(
                "next_week_goal",
                "Save weekly sleep progress to generate a next-week sleep goal.",
            ),
            "next_week_recommendation": sleep_progress_summary.get(
                "next_week_recommendation",
                "Weekly sleep progress is not available yet.",
            ),
            "weekly_feedback": sleep_progress_record.get("weekly_feedback", ""),
            "daily_sleep": daily_sleep_items,
            "created_at": clean_datetime(sleep_progress_record.get("created_at")),
        }

    return {
        "message": "Progress report generated successfully",
        "generated_at": datetime.utcnow(),
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name") or user.get("full_name") or "FitLife User",
            "email": user.get("email"),
            "email_verified": user.get("is_verified", False),
        },
        "profile": {
            "height_cm": height_cm or "Not set",
            "weight_kg": weight_kg or "Not set",
            "activity_level": activity_level,
            "fitness_goal": fitness_goal,
            "fitness_level": fitness_level,
            "workout_days": workout_days,
            "diet_preference": diet_type,
            "health_conditions": user.get("health_conditions") or "None",
        },
        "summary": {
            "bmi_value": bmi_value if bmi_value else "Not set",
            "bmi_category": bmi_category,
            "health_risk": health_risk,
            "nutrition_score": nutrition_score,
            "sleep_score": sleep_score,
            "goal_progress": goal_progress,
            "diet_recommendation": diet_recommendation,
            "diet_confidence": diet_confidence,
            "diet_model_accuracy": diet_model_accuracy,
            "overall_score": overall_score,
        },
        "fitness": {
            "fitness_goal": fitness_goal,
            "fitness_level": fitness_level,
            "workout_days": workout_days,
            "activity_level": activity_level,
        },
        "diet": {
            "diet_recommendation": diet_recommendation,
            "confidence": diet_confidence,
            "model_accuracy": diet_model_accuracy,
            "algorithm_type": diet_algorithm,
            "daily_calorie_target": diet_daily_calories,
            "diet_type": diet_type,
            "meals_per_day": diet_meals_per_day,
            "created_at": diet_created_at,
        },
        "sleep_progress": sleep_progress_details,
        "goal": goal_details,
        "recommendations": recommendations,
    }