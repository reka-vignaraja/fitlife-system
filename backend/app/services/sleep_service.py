from datetime import datetime
from app.database.mongodb import get_database


def get_sleep_status(sleep_hours: float):
    if sleep_hours < 5:
        return "Poor Sleep"
    elif sleep_hours < 7:
        return "Insufficient Sleep"
    elif sleep_hours <= 9:
        return "Healthy Sleep"
    else:
        return "Oversleeping"


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

    quality = data.sleep_quality.lower()

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

    if data.screen_time_before_bed.lower() == "yes":
        score -= 10

    if data.caffeine_after_evening.lower() == "yes":
        score -= 10

    stress = data.stress_level.lower()

    if stress == "high":
        score -= 15
    elif stress == "medium":
        score -= 7
    elif stress == "low":
        score += 5

    return max(min(score, 100), 0)


def generate_sleep_recommendations(data, sleep_score):
    recommendations = []

    if data.sleep_hours < 7:
        recommendations.append("Try to sleep at least 7 to 9 hours per night.")
        recommendations.append("Create a fixed bedtime and wake-up routine.")

    if data.sleep_hours > 9:
        recommendations.append("Avoid oversleeping and maintain a consistent wake-up time.")

    if data.sleep_quality.lower() in ["poor", "average"]:
        recommendations.append("Keep your bedroom dark, quiet, and comfortable to improve sleep quality.")

    if data.interruptions >= 2:
        recommendations.append("Reduce sleep interruptions by avoiding heavy meals and excess water before bed.")

    if data.screen_time_before_bed.lower() == "yes":
        recommendations.append("Avoid mobile phone or laptop screens at least 30 to 60 minutes before sleep.")

    if data.caffeine_after_evening.lower() == "yes":
        recommendations.append("Avoid tea, coffee, or energy drinks in the evening.")

    if data.stress_level.lower() == "high":
        recommendations.append("Try breathing exercises, meditation, or light stretching before sleep.")

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