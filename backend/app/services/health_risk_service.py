from pathlib import Path
from datetime import datetime

import joblib
import pandas as pd
from fastapi import HTTPException

from app.database.mongodb import get_database


MODEL_PATH = (
    Path(__file__).resolve().parents[1]
    / "models"
    / "fitlife_health_risk_model.pkl"
)


def load_health_risk_model():
    if not MODEL_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail="Health risk model not found. Please train the model first.",
        )

    return joblib.load(MODEL_PATH)


def normalize_gender(value: str) -> str:
    value = value.strip().lower()

    if value == "female":
        return "Female"

    return "Male"


def normalize_activity_level(value: str) -> str:
    value = value.strip().lower()

    mapping = {
        "sedentary": "Sedentary",
        "light": "Lightly Active",
        "lightly active": "Lightly Active",
        "moderate": "Moderately Active",
        "moderately active": "Moderately Active",
        "active": "Moderately Active",
        "very active": "Very Active",
    }

    return mapping.get(value, "Sedentary")


def normalize_smoker(value: str) -> str:
    value = value.strip().lower()

    if value in ["yes", "y", "true", "smoker"]:
        return "Yes"

    return "No"


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    height_m = height_cm / 100
    bmi = weight_kg / (height_m * height_m)
    return round(bmi, 2)


def get_recommendation_details(risk_level: str):
    if risk_level == "High Risk":
        return {
            "plan_title": "Medical Lifestyle Improvement Plan",
            "message": "Your profile indicates a high health risk level. Careful lifestyle improvement is recommended.",
            "recommendations": [
                "Consult a healthcare professional for proper guidance.",
                "Reduce salty, oily, and high-cholesterol foods.",
                "Do light physical activity such as walking.",
                "Monitor blood pressure and cholesterol regularly.",
                "Avoid smoking and maintain a healthy routine.",
            ],
        }

    if risk_level == "Medium Risk":
        return {
            "plan_title": "Guided Health Improvement Plan",
            "message": "Your profile indicates a medium health risk level. Lifestyle improvement can help reduce risk.",
            "recommendations": [
                "Follow a balanced diet with vegetables, fruits, and protein.",
                "Exercise at least 3 to 4 days per week.",
                "Reduce sugary drinks and processed foods.",
                "Maintain healthy sleep and water intake.",
                "Track BMI, blood pressure, and cholesterol regularly.",
            ],
        }

    return {
        "plan_title": "Healthy Maintenance Plan",
        "message": "Your profile indicates a low health risk level. Continue maintaining a healthy lifestyle.",
        "recommendations": [
            "Continue regular physical activity.",
            "Maintain a balanced diet.",
            "Drink enough water daily.",
            "Keep a consistent sleep routine.",
            "Monitor your health progress monthly.",
        ],
    }


def predict_health_risk(data):
    model_package = load_health_risk_model()
    pipeline = model_package["pipeline"]

    bmi = calculate_bmi(data.weight_kg, data.height_cm)

    input_data = pd.DataFrame(
        [
            {
                "Height": data.height_cm,
                "Weight": data.weight_kg,
                "Age": data.age,
                "Systolic_BP": data.systolic_bp,
                "Diastolic_BP": data.diastolic_bp,
                "Cholesterol": data.cholesterol,
                "Gender": normalize_gender(data.gender),
                "Activity_Level": normalize_activity_level(data.activity_level),
                "Smoker": normalize_smoker(data.smoker),
            }
        ]
    )

    predicted_risk = pipeline.predict(input_data)[0]

    confidence = None

    if hasattr(pipeline, "predict_proba"):
        probabilities = pipeline.predict_proba(input_data)[0]
        confidence = round(float(max(probabilities)) * 100, 2)

    details = get_recommendation_details(predicted_risk)

    result = {
        "age": data.age,
        "gender": normalize_gender(data.gender),
        "height_cm": data.height_cm,
        "weight_kg": data.weight_kg,
        "bmi": bmi,
        "activity_level": normalize_activity_level(data.activity_level),
        "systolic_bp": data.systolic_bp,
        "diastolic_bp": data.diastolic_bp,
        "cholesterol": data.cholesterol,
        "smoker": normalize_smoker(data.smoker),
        "predicted_risk_level": predicted_risk,
        "confidence": confidence,
        "plan_title": details["plan_title"],
        "message": details["message"],
        "recommendations": details["recommendations"],
        "model_name": model_package.get("model_name"),
        "algorithm": model_package.get("best_algorithm"),
        "model_accuracy": model_package.get("accuracy"),
        "disclaimer": "This prediction is for educational guidance only. It is not medical advice.",
        "created_at": datetime.utcnow(),
    }

    try:
        db = get_database()
        insert_result = db["health_risk_predictions"].insert_one(result.copy())
        result["_id"] = str(insert_result.inserted_id)
    except Exception:
        result["_id"] = None

    result["created_at"] = result["created_at"].isoformat()

    return result