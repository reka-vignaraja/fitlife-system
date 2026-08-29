from datetime import datetime
from app.database.mongodb import get_database


def yes_no(value: str):
    return (value or "").strip().lower() == "yes"


def get_sleep_status(sleep_hours: float):
    if sleep_hours < 5:
        return "Poor Sleep"
    elif sleep_hours < 7:
        return "Insufficient Sleep"
    elif sleep_hours <= 9:
        return "Healthy Sleep"
    else:
        return "Oversleeping"


def calculate_bedroom_environment_score(data):
    score = 0

    if yes_no(data.bedroom_dark):
        score += 25

    if yes_no(data.bedroom_quiet):
        score += 25

    if yes_no(data.bedroom_cool):
        score += 25

    if yes_no(data.comfortable_bed):
        score += 25

    return score


def calculate_sleep_score(data):
    score = 70

    if 7 <= data.sleep_hours <= 9:
        score += 15
    elif 5 <= data.sleep_hours < 7:
        score -= 5
    elif data.sleep_hours < 5:
        score -= 20
    elif data.sleep_hours > 9:
        score -= 8

    quality = (data.sleep_quality or "").lower()

    if quality == "excellent":
        score += 10
    elif quality == "good":
        score += 5
    elif quality == "average":
        score -= 5
    elif quality == "poor":
        score -= 15

    if data.interruptions == 0:
        score += 5
    elif data.interruptions >= 3:
        score -= 10

    if yes_no(data.screen_time_before_bed):
        score -= 10

    if yes_no(data.caffeine_after_evening):
        score -= 10

    stress = (data.stress_level or "").lower()

    if stress == "high":
        score -= 15
    elif stress in ["medium", "moderate"]:
        score -= 7
    elif stress == "low":
        score += 5

    sleep_latency = data.sleep_latency_minutes or 0

    if sleep_latency <= 15:
        score += 5
    elif sleep_latency <= 30:
        score += 0
    elif sleep_latency <= 60:
        score -= 8
    else:
        score -= 15

    daytime_sleepiness = (data.daytime_sleepiness or "").lower()

    if daytime_sleepiness == "high":
        score -= 10
    elif daytime_sleepiness == "medium":
        score -= 4
    elif daytime_sleepiness == "low":
        score += 3

    if yes_no(data.late_heavy_meal):
        score -= 5

    if yes_no(data.exercise_today):
        score += 3

    bedroom_score = calculate_bedroom_environment_score(data)

    if bedroom_score == 100:
        score += 5
    elif bedroom_score < 50:
        score -= 8
    elif bedroom_score < 75:
        score -= 4

    return max(min(score, 100), 0)


def generate_sleep_recommendations(data, sleep_score):
    recommendations = []

    if data.sleep_hours < 7:
        recommendations.append("Try to sleep at least 7 to 9 hours per night.")
        recommendations.append("Create a fixed bedtime and wake-up routine.")

    if data.sleep_hours > 9:
        recommendations.append("Avoid oversleeping and maintain a consistent wake-up time.")

    if (data.sleep_quality or "").lower() in ["poor", "average"]:
        recommendations.append("Keep your bedroom dark, quiet, cool, and comfortable to improve sleep quality.")

    if data.interruptions >= 2:
        recommendations.append("Reduce sleep interruptions by avoiding heavy meals and excess water before bed.")

    if yes_no(data.screen_time_before_bed):
        recommendations.append("Avoid mobile phone or laptop screens at least 30 to 60 minutes before sleep.")

    if yes_no(data.caffeine_after_evening):
        recommendations.append("Avoid tea, coffee, or energy drinks in the evening.")

    if (data.stress_level or "").lower() == "high":
        recommendations.append("Try breathing exercises, meditation, or light stretching before sleep.")

    if data.sleep_latency_minutes and data.sleep_latency_minutes > 30:
        recommendations.append("You are taking longer to fall asleep. Try a wind-down routine before bedtime.")

    if (data.daytime_sleepiness or "").lower() == "high":
        recommendations.append("High daytime sleepiness was recorded. Improve sleep duration and consistency.")

    if yes_no(data.late_heavy_meal):
        recommendations.append("Avoid heavy meals close to bedtime because it can disturb sleep.")

    if not yes_no(data.bedroom_dark):
        recommendations.append("Keep the bedroom darker during sleep time.")

    if not yes_no(data.bedroom_quiet):
        recommendations.append("Reduce noise in the bedroom or use a calm sleep environment.")

    if not yes_no(data.bedroom_cool):
        recommendations.append("Keep the bedroom cool and comfortable for better sleep.")

    if not yes_no(data.comfortable_bed):
        recommendations.append("Improve bedding comfort to reduce sleep disturbance.")

    if sleep_score >= 80:
        recommendations.append("Your sleep pattern is good. Continue maintaining this healthy routine.")

    if len(recommendations) == 0:
        recommendations.append("Maintain your current sleep routine and continue tracking regularly.")

    return recommendations


def generate_ai_sleep_analysis(data):
    db = get_database()
    sleep_collection = db["sleep_records"]

    sleep_status = get_sleep_status(data.sleep_hours)
    sleep_score = calculate_sleep_score(data)
    recommendations = generate_sleep_recommendations(data, sleep_score)
    bedroom_environment_score = calculate_bedroom_environment_score(data)

    result = {
        "age": data.age,
        "gender": data.gender,
        "sleep_hours": data.sleep_hours,
        "sleep_quality": data.sleep_quality,
        "bedtime": data.bedtime,
        "wake_time": data.wake_time,
        "interruptions": data.interruptions,
        "screen_time_before_bed": data.screen_time_before_bed,
        "caffeine_after_evening": data.caffeine_after_evening,
        "stress_level": data.stress_level,
        "sleep_latency_minutes": data.sleep_latency_minutes,
        "daytime_sleepiness": data.daytime_sleepiness,
        "late_heavy_meal": data.late_heavy_meal,
        "exercise_today": data.exercise_today,
        "bedroom_dark": data.bedroom_dark,
        "bedroom_quiet": data.bedroom_quiet,
        "bedroom_cool": data.bedroom_cool,
        "comfortable_bed": data.comfortable_bed,
        "bedroom_environment_score": bedroom_environment_score,
        "notes": data.notes,
        "sleep_status": sleep_status,
        "sleep_score": sleep_score,
        "recommendations": recommendations,
        "disclaimer": "This is an AI-generated educational sleep analysis. It is not medical advice.",
        "created_at": datetime.utcnow(),
    }

    insert_result = sleep_collection.insert_one(result.copy())

    result["_id"] = str(insert_result.inserted_id)
    result["created_at"] = result["created_at"].isoformat()

    return result