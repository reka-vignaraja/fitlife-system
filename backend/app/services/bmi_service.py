from datetime import datetime
from app.database.mongodb import get_database


def calculate_bmi_value(weight_kg: float, height_cm: float):
    height_m = height_cm / 100
    bmi = weight_kg / (height_m * height_m)

    if bmi < 18.5:
        category = "Underweight"
        message = (
            "You are underweight. A balanced diet with enough calories and "
            "strength exercises may help."
        )
        recommendations = [
            "Increase healthy calorie intake.",
            "Include protein-rich foods in meals.",
            "Do strength training 3 to 4 days per week.",
            "Avoid skipping meals.",
        ]

    elif bmi < 25:
        category = "Normal"
        message = "Your BMI is within the normal range. Maintain your healthy lifestyle."
        recommendations = [
            "Maintain a balanced diet.",
            "Exercise regularly.",
            "Drink enough water daily.",
            "Keep a consistent sleep routine.",
        ]

    elif bmi < 30:
        category = "Overweight"
        message = (
            "You are overweight. A calorie-controlled diet and regular exercise "
            "may help."
        )
        recommendations = [
            "Reduce sugary drinks and fried foods.",
            "Increase vegetables, fruits, and fiber-rich foods.",
            "Do cardio and strength workouts regularly.",
            "Track your progress weekly.",
        ]

    else:
        category = "Obese"
        message = "Your BMI is in the obese range. Lifestyle changes are recommended."
        recommendations = [
            "Follow a calorie-controlled diet plan.",
            "Start with low-impact exercises such as walking.",
            "Avoid processed and high-sugar foods.",
            "Consult a healthcare professional for safe guidance.",
        ]

    return round(bmi, 2), category, message, recommendations


def generate_bmi_result(data):
    db = get_database()
    bmi_collection = db["bmi_records"]

    bmi, category, message, recommendations = calculate_bmi_value(
        data.weight_kg,
        data.height_cm,
    )

    result = {
        "age": data.age,
        "gender": data.gender,
        "height_cm": data.height_cm,
        "weight_kg": data.weight_kg,
        "activity_level": data.activity_level,
        "goal": data.goal,
        "bmi": bmi,
        "bmi_category": category,
        "message": message,
        "recommendations": recommendations,
        "disclaimer": "This BMI result is for educational guidance only. It is not medical advice.",
        "created_at": datetime.utcnow(),
    }

    insert_result = bmi_collection.insert_one(result.copy())

    result["_id"] = str(insert_result.inserted_id)
    result["created_at"] = result["created_at"].isoformat()

    return result