from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException

from app.database.mongodb import get_database


DEFAULT_WORKOUT_SLOTS = [
    "Workout 1",
    "Workout 2",
    "Workout 3",
    "Workout 4",
    "Workout 5",
    "Workout 6",
]


def schema_to_dict(item):
    if hasattr(item, "model_dump"):
        return item.model_dump()
    return item.dict()


def normalize_daily_progress(daily_progress):
    """
    Important:
    Do not convert progress to Monday-Sunday 7 days.
    Frontend sends only the planned workout count.
    Example: if user selected 4 workout days, frontend sends 4 progress items only.
    Backend must calculate progress using those 4 items only.
    """
    normalized = []

    for index, item in enumerate(daily_progress or []):
        item_dict = schema_to_dict(item)

        day = item_dict.get("day") or (
            DEFAULT_WORKOUT_SLOTS[index]
            if index < len(DEFAULT_WORKOUT_SLOTS)
            else f"Workout {index + 1}"
        )

        status = item_dict.get("status", "pending")

        if status not in ["completed", "skipped", "pending"]:
            status = "pending"

        difficulty = item_dict.get("difficulty", "not done")

        if difficulty not in ["easy", "moderate", "hard", "not done"]:
            difficulty = "not done"

        normalized.append(
            {
                "day": str(day).strip(),
                "status": status,
                "duration_minutes": item_dict.get("duration_minutes", 0) or 0,
                "difficulty": difficulty,
                "notes": item_dict.get("notes", "") or "",
            }
        )

    return normalized


def calculate_progress_summary(daily_progress):
    total_days = len(daily_progress)

    completed_days = sum(
        1 for item in daily_progress if item.get("status") == "completed"
    )

    skipped_days = sum(
        1 for item in daily_progress if item.get("status") == "skipped"
    )

    pending_days = sum(
        1 for item in daily_progress if item.get("status") == "pending"
    )

    if total_days == 0:
        completion_percentage = 0
    else:
        completion_percentage = round((completed_days / total_days) * 100)

    return {
        "planned_workout_days": total_days,
        "completed_days": completed_days,
        "skipped_days": skipped_days,
        "pending_days": pending_days,
        "completion_percentage": completion_percentage,
    }


def get_next_week_adjustment(
    completion_percentage: int,
    current_weight_kg: float,
    previous_weight_kg,
    overall_difficulty: str,
    energy_level: str,
):
    overall_difficulty = (overall_difficulty or "").lower()
    energy_level = (energy_level or "").lower()

    weight_change_message = ""

    if previous_weight_kg:
        weight_difference = round(current_weight_kg - previous_weight_kg, 1)

        if weight_difference > 0:
            weight_change_message = (
                f"Current weight increased by {weight_difference} kg. "
            )
        elif weight_difference < 0:
            weight_change_message = (
                f"Current weight decreased by {abs(weight_difference)} kg. "
            )
        else:
            weight_change_message = "Current weight is stable. "

    if completion_percentage >= 80 and overall_difficulty in ["easy", "moderate"]:
        return (
            weight_change_message
            + "Great progress. Next week plan can slightly increase intensity, duration, or exercise volume."
        )

    if completion_percentage >= 60:
        return (
            weight_change_message
            + "Good consistency. Next week plan should maintain the current intensity with small improvements."
        )

    if completion_percentage < 40:
        return (
            weight_change_message
            + "Completion is low. Next week plan should reduce difficulty, add easier exercises, and improve consistency."
        )

    if overall_difficulty == "hard" or energy_level == "low":
        return (
            weight_change_message
            + "The workout felt difficult. Next week plan should reduce intensity and include more recovery support."
        )

    return (
        weight_change_message
        + "Progress is moderate. Next week plan should continue safely with gradual improvement."
    )


def save_fitness_progress(data, user_id: str):
    db = get_database()

    users_collection = db["users"]
    progress_collection = db["fitness_progress"]

    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user id")

    user = users_collection.find_one({"_id": user_object_id})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    daily_progress = normalize_daily_progress(data.daily_progress)
    summary = calculate_progress_summary(daily_progress)

    next_week_adjustment = get_next_week_adjustment(
        summary["completion_percentage"],
        data.current_weight_kg,
        data.previous_weight_kg,
        data.overall_difficulty,
        data.energy_level,
    )

    week_start_date = data.week_start_date or ""

    progress_data = {
        "user_id": user_id,
        "user_object_id": user_object_id,
        "plan_id": data.plan_id or "",
        "week_start_date": week_start_date,
        "current_weight_kg": data.current_weight_kg,
        "previous_weight_kg": data.previous_weight_kg,
        "daily_progress": daily_progress,
        "planned_workout_days": summary["planned_workout_days"],
        "completed_days": summary["completed_days"],
        "skipped_days": summary["skipped_days"],
        "pending_days": summary["pending_days"],
        "completion_percentage": summary["completion_percentage"],
        "energy_level": data.energy_level,
        "overall_difficulty": data.overall_difficulty,
        "feedback": data.feedback or "",
        "next_week_adjustment": next_week_adjustment,
        "updated_at": datetime.utcnow(),
    }

    # Same week progress should be updated, not duplicated.
    progress_collection.update_one(
        {
            "user_id": user_id,
            "week_start_date": week_start_date,
        },
        {
            "$set": progress_data,
            "$setOnInsert": {
                "created_at": datetime.utcnow(),
            },
        },
        upsert=True,
    )

    saved_progress = progress_collection.find_one(
        {
            "user_id": user_id,
            "week_start_date": week_start_date,
        },
        sort=[("updated_at", -1), ("created_at", -1)],
    )

    return {
        "message": "Weekly fitness progress saved successfully",
        "saved_to_database": True,
        "progress_id": str(saved_progress["_id"]),
        "planned_workout_days": summary["planned_workout_days"],
        "completion_percentage": summary["completion_percentage"],
        "completed_days": summary["completed_days"],
        "skipped_days": summary["skipped_days"],
        "pending_days": summary["pending_days"],
        "next_week_adjustment": next_week_adjustment,
    }


def get_latest_fitness_progress(user_id: str):
    db = get_database()

    progress_collection = db["fitness_progress"]

    latest_progress = progress_collection.find_one(
        {"user_id": user_id},
        sort=[("updated_at", -1), ("created_at", -1)],
    )

    if not latest_progress:
        return {
            "message": "No fitness progress found",
            "has_progress": False,
            "progress": None,
        }

    latest_progress["_id"] = str(latest_progress["_id"])

    if "user_object_id" in latest_progress:
        latest_progress["user_object_id"] = str(latest_progress["user_object_id"])

    if "created_at" in latest_progress and latest_progress["created_at"]:
        latest_progress["created_at"] = latest_progress["created_at"].isoformat()

    if "updated_at" in latest_progress and latest_progress["updated_at"]:
        latest_progress["updated_at"] = latest_progress["updated_at"].isoformat()

    return {
        "message": "Latest fitness progress loaded successfully",
        "has_progress": True,
        "progress": latest_progress,
    }