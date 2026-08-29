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


def yes_no(value):
    return str(value or "").strip().lower() == "yes"


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
                "sleep_latency_minutes": int(
                    item_dict.get("sleep_latency_minutes", 0) or 0
                ),
                "daytime_sleepiness": item_dict.get(
                    "daytime_sleepiness", "medium"
                ),
                "screen_time_before_bed": item_dict.get(
                    "screen_time_before_bed", "no"
                ),
                "caffeine_after_evening": item_dict.get(
                    "caffeine_after_evening", "no"
                ),
                "late_heavy_meal": item_dict.get("late_heavy_meal", "no"),
                "bedroom_dark": item_dict.get("bedroom_dark", "yes"),
                "bedroom_quiet": item_dict.get("bedroom_quiet", "yes"),
                "bedroom_cool": item_dict.get("bedroom_cool", "yes"),
                "comfortable_bed": item_dict.get("comfortable_bed", "yes"),
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
            "sleep_latency_minutes": 0,
            "daytime_sleepiness": "medium",
            "screen_time_before_bed": "no",
            "caffeine_after_evening": "no",
            "late_heavy_meal": "no",
            "bedroom_dark": "yes",
            "bedroom_quiet": "yes",
            "bedroom_cool": "yes",
            "comfortable_bed": "yes",
        }
        for item in week_dates
    ]


def parse_time_to_minutes(time_text, is_bedtime=False):
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

        # Bedtime may cross midnight, so 12 AM-11 AM is treated as after midnight.
        if is_bedtime and parsed_time.hour < 12:
            minutes += 1440

        return minutes

    except Exception:
        return None


def calculate_time_consistency_score(daily_sleep, field_name, is_bedtime=False):
    recorded_days = [
        item for item in daily_sleep if float(item.get("sleep_hours", 0) or 0) > 0
    ]

    time_values = [
        parse_time_to_minutes(item.get(field_name, ""), is_bedtime=is_bedtime)
        for item in recorded_days
    ]

    time_values = [item for item in time_values if item is not None]

    if len(time_values) == 0:
        return 0

    if len(time_values) == 1:
        return 50

    time_range = max(time_values) - min(time_values)

    if time_range <= 30:
        return 100

    if time_range <= 60:
        return 85

    if time_range <= 120:
        return 70

    if time_range <= 180:
        return 55

    return 40


def calculate_irregular_bedtime_days(daily_sleep):
    recorded_days = [
        item for item in daily_sleep if float(item.get("sleep_hours", 0) or 0) > 0
    ]

    bedtime_values = [
        parse_time_to_minutes(item.get("bedtime", ""), is_bedtime=True)
        for item in recorded_days
    ]

    bedtime_values = [item for item in bedtime_values if item is not None]

    if len(bedtime_values) < 2:
        return 0

    sorted_values = sorted(bedtime_values)
    middle = len(sorted_values) // 2

    if len(sorted_values) % 2 == 0:
        median = (sorted_values[middle - 1] + sorted_values[middle]) / 2
    else:
        median = sorted_values[middle]

    irregular_count = len(
        [item for item in bedtime_values if abs(item - median) > 60]
    )

    return irregular_count


def calculate_consistency_score(daily_sleep):
    recorded_days = [
        item for item in daily_sleep if float(item.get("sleep_hours", 0) or 0) > 0
    ]

    if len(recorded_days) < 2:
        return 50 if recorded_days else 0

    sleep_values = [
        float(item.get("sleep_hours", 0) or 0) for item in recorded_days
    ]

    sleep_range = max(sleep_values) - min(sleep_values)

    bedtime_score = calculate_time_consistency_score(
        recorded_days,
        "bedtime",
        is_bedtime=True,
    )

    wake_score = calculate_time_consistency_score(
        recorded_days,
        "wake_time",
        is_bedtime=False,
    )

    score = round((bedtime_score + wake_score) / 2)

    if sleep_range > 2:
        score -= 20
    elif sleep_range > 1:
        score -= 10

    interrupted_days = len(
        [
            item
            for item in recorded_days
            if int(item.get("interruptions", 0) or 0) >= 2
        ]
    )

    score -= interrupted_days * 4

    return max(0, min(100, round(score)))


def get_routine_status(consistency_score):
    if consistency_score >= 85:
        return "Consistent Routine"

    if consistency_score >= 70:
        return "Fairly Consistent"

    if consistency_score >= 50:
        return "Irregular Routine"

    return "Very Irregular Routine"


def get_target_gap_message(average_sleep_hours, recommended_sleep_hours):
    gap = round(recommended_sleep_hours - average_sleep_hours, 2)

    if gap > 0:
        return f"You are {gap} hours below your recommended sleep target."

    if gap < -1:
        return f"You are sleeping {abs(gap)} hours above your recommended target."

    return "Your average sleep duration is close to your recommended target."


def get_weekly_insight_explanation(
    average_sleep_hours,
    sleep_debt_hours,
    consistency_score,
    routine_status,
    good_sleep_days,
    poor_sleep_days,
    interrupted_days,
    recommended_sleep_hours,
):
    parts = []

    parts.append(
        f"This week your average sleep was {average_sleep_hours} hours."
    )

    if average_sleep_hours < recommended_sleep_hours:
        parts.append(
            f"You were below the recommended target by {sleep_debt_hours} total hours across recorded days."
        )
    else:
        parts.append("Your sleep duration met the recommended target.")

    parts.append(
        f"Your routine status is {routine_status.lower()} with a consistency score of {consistency_score}%."
    )

    if good_sleep_days > poor_sleep_days:
        parts.append("You recorded more good sleep days than poor sleep days.")
    elif poor_sleep_days > good_sleep_days:
        parts.append("Poor sleep days were higher than good sleep days.")
    else:
        parts.append("Good and poor sleep day balance was similar.")

    if interrupted_days >= 3:
        parts.append("Frequent interruptions affected your weekly sleep pattern.")

    return " ".join(parts)


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
            "bedtime_consistency_score": 0,
            "wake_time_consistency_score": 0,
            "routine_status": "No weekly sleep data",
            "irregular_bedtime_days": 0,
            "good_sleep_days": 0,
            "poor_sleep_days": 0,
            "interrupted_days": 0,
            "improvement_status": "No weekly sleep data",
            "target_gap_message": "No sleep records are available for this week.",
            "weekly_insight_explanation": "Record sleep for at least one day to generate weekly insights.",
            "next_week_goal": "Record your sleep for at least 5 days next week.",
            "next_week_recommendation": "Start tracking sleep hours, bedtime, wake time and interruptions daily.",
        }

    total_sleep = sum(float(item.get("sleep_hours", 0) or 0) for item in recorded_days)
    recorded_count = len(recorded_days)

    average_sleep_hours = round(total_sleep / recorded_count, 2)

    recommended_sleep_hours = float(recommended_sleep_hours)
    expected_sleep = recommended_sleep_hours * recorded_count
    sleep_debt_hours = round(max(0, expected_sleep - total_sleep), 2)

    bedtime_consistency_score = calculate_time_consistency_score(
        recorded_days,
        "bedtime",
        is_bedtime=True,
    )

    wake_time_consistency_score = calculate_time_consistency_score(
        recorded_days,
        "wake_time",
        is_bedtime=False,
    )

    consistency_score = calculate_consistency_score(recorded_days)
    routine_status = get_routine_status(consistency_score)
    irregular_bedtime_days = calculate_irregular_bedtime_days(recorded_days)

    good_sleep_days = len(
        [
            item
            for item in recorded_days
            if item.get("sleep_quality") in ["good", "excellent"]
            and float(item.get("sleep_hours", 0) or 0)
            >= recommended_sleep_hours - 0.5
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
            or item.get("daytime_sleepiness") == "high"
        ]
    )

    interrupted_days = len(
        [
            item
            for item in recorded_days
            if int(item.get("interruptions", 0) or 0) > 0
        ]
    )

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

    target_gap_message = get_target_gap_message(
        average_sleep_hours,
        recommended_sleep_hours,
    )

    weekly_insight_explanation = get_weekly_insight_explanation(
        average_sleep_hours=average_sleep_hours,
        sleep_debt_hours=sleep_debt_hours,
        consistency_score=consistency_score,
        routine_status=routine_status,
        good_sleep_days=good_sleep_days,
        poor_sleep_days=poor_sleep_days,
        interrupted_days=interrupted_days,
        recommended_sleep_hours=recommended_sleep_hours,
    )

    recommendations = []

    if sleep_debt_hours > 0:
        recommendations.append(
            f"You have {sleep_debt_hours} hours of sleep debt for the recorded days."
        )

    if consistency_score < 70:
        recommendations.append(
            "Your sleep timing is irregular. Try to sleep and wake up at similar times."
        )

    if irregular_bedtime_days >= 2:
        recommendations.append(
            f"{irregular_bedtime_days} recorded days had bedtime variation above one hour."
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

    high_sleepiness_days = len(
        [
            item
            for item in recorded_days
            if item.get("daytime_sleepiness") == "high"
        ]
    )

    if high_sleepiness_days >= 2:
        recommendations.append(
            "High daytime sleepiness appeared multiple times. Improve sleep duration and consistency."
        )

    bad_environment_days = len(
        [
            item
            for item in recorded_days
            if not yes_no(item.get("bedroom_dark"))
            or not yes_no(item.get("bedroom_quiet"))
            or not yes_no(item.get("bedroom_cool"))
            or not yes_no(item.get("comfortable_bed"))
        ]
    )

    if bad_environment_days >= 2:
        recommendations.append(
            "Bedroom environment was not ideal on multiple days. Keep the room dark, quiet, cool and comfortable."
        )

    if not recommendations:
        recommendations.append(
            "Your sleep pattern looks healthy. Continue maintaining your current routine."
        )

    return {
        "average_sleep_hours": average_sleep_hours,
        "sleep_debt_hours": sleep_debt_hours,
        "consistency_score": consistency_score,
        "bedtime_consistency_score": bedtime_consistency_score,
        "wake_time_consistency_score": wake_time_consistency_score,
        "routine_status": routine_status,
        "irregular_bedtime_days": irregular_bedtime_days,
        "good_sleep_days": good_sleep_days,
        "poor_sleep_days": poor_sleep_days,
        "interrupted_days": interrupted_days,
        "improvement_status": improvement_status,
        "target_gap_message": target_gap_message,
        "weekly_insight_explanation": weekly_insight_explanation,
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
        {
            "user_id": user_id,
            "week_start_date": {"$ne": data.week_start_date},
        },
        sort=[("updated_at", -1), ("created_at", -1)],
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

    record_data = {
        "user_id": user_id,
        "user_object_id": ObjectId(user_id),
        "week_start_date": data.week_start_date,
        "recommended_sleep_hours": data.recommended_sleep_hours,
        "previous_average_sleep_hours": previous_average,
        "weekly_feedback": data.weekly_feedback,
        "daily_sleep": daily_sleep,
        "summary": summary,
        "updated_at": datetime.utcnow(),
    }

    sleep_progress_collection.update_one(
        {
            "user_id": user_id,
            "week_start_date": data.week_start_date,
        },
        {
            "$set": record_data,
            "$setOnInsert": {
                "created_at": datetime.utcnow(),
            },
        },
        upsert=True,
    )

    saved_record = sleep_progress_collection.find_one(
        {
            "user_id": user_id,
            "week_start_date": data.week_start_date,
        },
        sort=[("updated_at", -1), ("created_at", -1)],
    )

    return {
        "message": "Weekly sleep progress saved successfully",
        "saved_to_database": True,
        "progress_id": str(saved_record["_id"]),
        **summary,
    }


def get_latest_sleep_progress(user_id):
    db = get_database()

    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=401, detail="Invalid user ID")

    sleep_progress_collection = db["sleep_progress"]

    latest_progress = sleep_progress_collection.find_one(
        {"user_id": user_id},
        sort=[("updated_at", -1), ("created_at", -1)],
    )

    if not latest_progress:
        return {
            "has_progress": False,
            "progress": None,
        }

    latest_progress["_id"] = str(latest_progress["_id"])

    if "user_object_id" in latest_progress:
        latest_progress["user_object_id"] = str(latest_progress["user_object_id"])

    if latest_progress.get("created_at"):
        latest_progress["created_at"] = latest_progress["created_at"].isoformat()

    if latest_progress.get("updated_at"):
        latest_progress["updated_at"] = latest_progress["updated_at"].isoformat()

    summary = latest_progress.get("summary", {})

    latest_progress.update(summary)

    return {
        "has_progress": True,
        "progress": latest_progress,
    }