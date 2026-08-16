from pathlib import Path
import sys

import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv


# Backend base directory
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR))

# Load .env file
load_dotenv(BASE_DIR / ".env")

from app.core.config import settings


# CSV dataset path
CSV_PATH = BASE_DIR / "data" / "weight-height.csv"


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Remove empty and duplicate rows
    df = df.dropna()
    df = df.drop_duplicates()

    # Keep valid health ranges only
    df = df[
        (df["Height"] >= 100)
        & (df["Height"] <= 230)
        & (df["Weight"] >= 30)
        & (df["Weight"] <= 250)
        & (df["Age"] >= 10)
        & (df["Age"] <= 100)
        & (df["BMI"] >= 10)
        & (df["BMI"] <= 60)
    ]

    # Clean text columns
    text_columns = [
        "Gender",
        "Activity_Level",
        "Weight_Category",
        "BP_Category",
        "Cholesterol_Category",
        "Smoker",
    ]

    for col in text_columns:
        df[col] = df[col].astype(str).str.strip()

    return df


def create_health_risk_level(row):
    bmi = row["BMI"]
    systolic = row["Systolic_BP"]
    diastolic = row["Diastolic_BP"]
    cholesterol = row["Cholesterol"]
    smoker = row["Smoker"]
    age = row["Age"]
    activity = row["Activity_Level"]

    high_risk_conditions = 0
    medium_risk_conditions = 0

    # BMI risk
    if bmi >= 30 or bmi < 18.5:
        high_risk_conditions += 1
    elif bmi >= 25:
        medium_risk_conditions += 1

    # Blood pressure risk
    if systolic >= 140 or diastolic >= 90:
        high_risk_conditions += 1
    elif systolic >= 120 or diastolic >= 80:
        medium_risk_conditions += 1

    # Cholesterol risk
    if cholesterol >= 240:
        high_risk_conditions += 1
    elif cholesterol >= 200:
        medium_risk_conditions += 1

    # Smoking risk
    if smoker == "Yes":
        high_risk_conditions += 1

    # Age risk
    if age >= 60:
        medium_risk_conditions += 1

    # Activity level risk
    if activity == "Sedentary":
        medium_risk_conditions += 1

    # Final health risk label
    if high_risk_conditions >= 2:
        return "High Risk"

    if high_risk_conditions == 1 or medium_risk_conditions >= 2:
        return "Medium Risk"

    return "Low Risk"


def create_recommendation_from_risk(risk_level):
    if risk_level == "High Risk":
        return "medical_lifestyle_plan"

    if risk_level == "Medium Risk":
        return "guided_health_improvement_plan"

    return "healthy_maintenance_plan"


def main():
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV file not found: {CSV_PATH}")

    print("Reading dataset...")
    df = pd.read_csv(CSV_PATH)

    print("Cleaning dataset...")
    df = clean_dataset(df)

    print("Creating health risk labels...")
    df["health_risk_level"] = df.apply(create_health_risk_level, axis=1)

    print("Creating recommendation labels...")
    df["recommendation_plan"] = df["health_risk_level"].apply(
        create_recommendation_from_risk
    )

    # Connect MongoDB
    client = MongoClient(settings.MONGO_URI)
    db = client[settings.DATABASE_NAME]

    collection = db["health_dataset"]

    # Remove old dataset and insert new dataset
    collection.delete_many({})

    records = df.to_dict("records")

    if records:
        collection.insert_many(records)

    print()
    print("Dataset inserted successfully")
    print("Database:", settings.DATABASE_NAME)
    print("Collection: health_dataset")
    print("Total records inserted:", len(records))

    print()
    print("Health risk level count:")
    print(df["health_risk_level"].value_counts())

    print()
    print("Recommendation plan count:")
    print(df["recommendation_plan"].value_counts())

    client.close()


if __name__ == "__main__":
    main()