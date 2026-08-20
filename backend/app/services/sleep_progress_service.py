from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import HTTPException

from app.database.mongodb import get_database


WEEK_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]


def schema_to_dict(item):
    if hasattr(item, "model_dump"):
        return item.model_dump()

    return item.dict()


def parse_date(date_text):
    try:
        if not date_text:
            return None

        return datetime.strptime(date_text, "%Y-%m-%d")
    except Exception:
        return None


def get_day_name_from_date(date_text):
    parsed_date = parse_date(date_text)

    if not parsed_date:
        return ""

    return parsed_date.strftime("%A")


def get_week_dates(week_start_date):
    parsed_start = parse_date(week_start_date)

    if not parsed_start:
        parsed_start = datetime.now()

    return [
        {
            "date": (parsed_start + timedelta(days=index)).strftime("%Y-%m-%d"),
            "day": (parsed_start + timedelta(days=index)).strftime("%A"),
        }
        for index in range(7)
    ]


def normalize_daily_sleep(daily_sleep, week_start_date=""):
    daily_items = []

    for item in daily_sleep:
        item_dict = schema_to_dict(item)

        date_value = item_dict.get("date", "")
        day_value = item_dict.get("day", "")

        if date_value and not day_value:
            day_value = get_day_name_from_date(date_value)

        if not day_value:
            day_value = "Unknown"

        daily_items.append(
            {
                "date": date_value,
                "day": day_value,
                "sleep_hours": float(item_dict.get("sleep_hours", 0) or 0),
                "sleep_quality": item_dict.get("sleep_quality", "average"),
                "bedtime": item_dict.get("bedtime", ""),
                "wake_time": item_dict.get("wake_time", ""),
                "interruptions": int(item_dict.get("interruptions", 0) or 0),
                "stress_level": item_dict.get("stress_level", "moderate"),
                "mood": item_dict.get("mood", "normal"),
            }
        )

    if daily_items:
        return daily_items

    week_dates = get_week_dates(week_start_date)

    return [
        {
            "date": item["date"],
            "day": item["day"],
            "sleep_hours": 0,
            "sleep_quality": "average",
            "bedtime": "",
            "wake_time": "",
            "interruptions": 0,
            "stress_level": "moderate",
            "mood": "normal",
        }
        for item in week_dates
    ]


def parse_time_to_minutes(time_text):
    try:
        if not time_text:
            return None

        cleaned = time_text.strip().upper()

        formats = ["%I:%M %p", "%H:%M"]

        parsed_time = None

        for fmt in formats:
            try:
                parsed_time = datetime.strptime(cleaned, fmt)
                break
            except ValueError:
                continue

        if not parsed_time:
            return None

        minutes = parsed_time.hour * 60 + parsed_time.minute

        if parsed_time.hour < 12:
            minutes += 1440

        return minutes
    except Exception:
        return None


def calculate_consistency_score(daily_sleep):
    recorded_days = [
        item for item in daily_sleep if float(item.get("sleep_hours", 0) or 0) > 0
    ]

    if len(recorded_days) < 2:
        return 50 if recorded_days else 0

    sleep_values = [float(item.get("sleep_hours", 0) or 0) for item in recorded_days]
    sleep_range = max(sleep_values) - min(sleep_values)

    bedtime_values = [
        parse_time_to_minutes(item.get("bedtime", "")) for item in recorded_days
    ]

    bedtime_values = [item for item in bedtime_values if item is not None]

    bedtime_range = 0

    if len(bedtime_values) >= 2:
        bedtime_range = max(bedtime_values) - min(bedtime_values)

    interrupted_days = len(
        [item for item in recorded_days if int(item.get("interruptions", 0) or 0) >= 2]
    )

    score = 100

    if sleep_range > 2:
        score -= 25
    elif sleep_range > 1:
        score -= 15

    if bedtime_range > 120:
        score -= 25
    elif bedtime_range > 60:
        score -= 15

    score -= interrupted_days * 5

    return max(0, min(100, round(score)))


def calculate_sleep_summary(
    daily_sleep,
    recommended_sleep_hours,
    previous_average_sleep_hours=None,
):
    recorded_days = [
        item for item in daily_sleep if float(item.get("sleep_hours", 0) or 0) > 0
    ]

    if not recorded_days:
        return {
            "average_sleep_hours": 0,
            "sleep_debt_hours": 0,
            "consistency_score": 0,
            "good_sleep_days": 0,
            "poor_sleep_days": 0,
            "interrupted_days": 0,
            "improvement_status": "No weekly sleep data",
            "next_week_goal": "Record your sleep for at least 5 days next week.",
            "next_week_recommendation": "Start tracking sleep hours, bedtime, wake time and interruptions daily.",
        }

    total_sleep = sum(float(item.get("sleep_hours", 0) or 0) for item in recorded_days)
    recorded_count = len(recorded_days)

    average_sleep_hours = round(total_sleep / recorded_count, 2)

    expected_sleep = float(recommended_sleep_hours) * recorded_count
    sleep_debt_hours = round(max(0, expected_sleep - total_sleep), 2)

    good_sleep_days = len(
        [
            item
            for item in recorded_days
            if item.get("sleep_quality") in ["good", "excellent"]
            and float(item.get("sleep_hours", 0) or 0) >= recommended_sleep_hours - 0.5
            and int(item.get("interruptions", 0) or 0) <= 2
        ]
    )

    poor_sleep_days = len(
        [
            item
            for item in recorded_days
            if item.get("sleep_quality") == "poor"
            or float(item.get("sleep_hours", 0) or 0) < 6
            or int(item.get("interruptions", 0) or 0) >= 4
        ]
    )

    interrupted_days = len(
        [item for item in recorded_days if int(item.get("interruptions", 0) or 0) > 0]
    )

    consistency_score = calculate_consistency_score(recorded_days)

    if previous_average_sleep_hours is None:
        improvement_status = "Baseline week"
    elif average_sleep_hours > previous_average_sleep_hours + 0.3:
        improvement_status = "Improving"
    elif average_sleep_hours < previous_average_sleep_hours - 0.3:
        improvement_status = "Declining"
    else:
        improvement_status = "Stable"

    if average_sleep_hours < recommended_sleep_hours:
        next_week_goal = (
            f"Try to increase average sleep to "
            f"{min(recommended_sleep_hours, average_sleep_hours + 0.5):.1f} hours next week."
        )
    else:
        next_week_goal = "Maintain your current sleep duration and keep bedtime consistent."

    recommendations = []

    if sleep_debt_hours > 0:
        recommendations.append(
            f"You have {sleep_debt_hours} hours of sleep debt for the recorded days."
        )

    if consistency_score < 70:
        recommendations.append(
            "Your sleep timing is irregular. Try to sleep and wake up at similar times."
        )

    if poor_sleep_days > good_sleep_days:
        recommendations.append(
            "Poor sleep days are higher than good sleep days. Improve routine and reduce screen time before bed."
        )

    if interrupted_days >= 3:
        recommendations.append(
            "Frequent sleep interruptions were recorded. Keep the room quiet, dark and comfortable."
        )

    high_stress_days = len(
        [item for item in recorded_days if item.get("stress_level") == "high"]
    )

    if high_stress_days >= 2:
        recommendations.append(
            "High stress appears in multiple days. Add relaxation or breathing practice before sleep."
        )

    if not recommendations:
        recommendations.append(
            "Your sleep pattern looks healthy. Continue maintaining your current routine."
        )

    return {
        "average_sleep_hours": average_sleep_hours,
        "sleep_debt_hours": sleep_debt_hours,
        "consistency_score": consistency_score,
        "good_sleep_days": good_sleep_days,
        "poor_sleep_days": poor_sleep_days,
        "interrupted_days": interrupted_days,
        "improvement_status": improvement_status,
        "next_week_goal": next_week_goal,
        "next_week_recommendation": " ".join(recommendations),
    }


def save_sleep_progress(data, user_id):
    db = get_database()

    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=401, detail="Invalid user ID")

    users_collection = db["users"]
    user = users_collection.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sleep_progress_collection = db["sleep_progress"]

    latest_previous = sleep_progress_collection.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)],
    )

    previous_average = data.previous_average_sleep_hours

    if previous_average is None and latest_previous:
        previous_summary = latest_previous.get("summary", {})
        previous_average = previous_summary.get("average_sleep_hours")

    daily_sleep = normalize_daily_sleep(data.daily_sleep, data.week_start_date)

    summary = calculate_sleep_summary(
        daily_sleep=daily_sleep,
        recommended_sleep_hours=data.recommended_sleep_hours,
        previous_average_sleep_hours=previous_average,
    )

    record = {
        "user_id": user_id,
        "user_object_id": ObjectId(user_id),
        "week_start_date": data.week_start_date,
        "recommended_sleep_hours": data.recommended_sleep_hours,
        "previous_average_sleep_hours": previous_average,
        "weekly_feedback": data.weekly_feedback,
        "daily_sleep": daily_sleep,
        "summary": summary,
        "created_at": datetime.utcnow(),
    }

    result = sleep_progress_collection.insert_one(record)

    return {
        "message": "Weekly sleep progress saved successfully",
        "saved_to_database": True,
        "progress_id": str(result.inserted_id),
        **summary,
    }


def get_latest_sleep_progress(user_id):
    db = get_database()

    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=401, detail="Invalid user ID")

    sleep_progress_collection = db["sleep_progress"]

    latest_progress = sleep_progress_collection.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)],
    )

    if not latest_progress:
        return {
            "has_progress": False,
            "progress": None,
        }

    latest_progress["_id"] = str(latest_progress["_id"])
    latest_progress["user_object_id"] = str(latest_progress["user_object_id"])

    if latest_progress.get("created_at"):
        latest_progress["created_at"] = latest_progress["created_at"].isoformat()

    summary = latest_progress.get("summary", {})

    latest_progress.update(summary)

    return {
        "has_progress": True,
        "progress": latest_progress,
    }
