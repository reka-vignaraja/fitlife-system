from pathlib import Path
import sys
import re

import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")

from app.core.config import settings


CSV_PATH = BASE_DIR / "data" / "nutrition.csv"


def extract_number(value):
    """
    Converts values like:
    '9.00 mg' -> 9.0
    '0.26 g'  -> 0.26
    '72g'     -> 72.0
    NaN       -> 0.0
    """
    if pd.isna(value):
        return 0.0

    value = str(value).strip()

    if value == "" or value.lower() == "nan":
        return 0.0

    match = re.search(r"[-+]?\d*\.\d+|\d+", value)

    if match:
        return float(match.group())

    return 0.0


def calculate_nutrition_score(row):
    """
    Simple rule-based nutrition score out of 100.
    Higher protein/fiber = good.
    High sugar/sodium/fat = reduce score.
    """
    score = 70

    if row["protein_g"] >= 10:
        score += 10

    if row["fiber_g"] >= 5:
        score += 10

    if row["calories"] <= 250:
        score += 5
    elif row["calories"] >= 500:
        score -= 10

    if row["sugar_g"] >= 15:
        score -= 10

    if row["sodium_mg"] >= 500:
        score -= 10

    if row["fat_g"] >= 25:
        score -= 10

    if row["saturated_fat_g"] >= 8:
        score -= 10

    return max(min(score, 100), 0)


def create_food_label(row):
    """
    Food category label for recommendation.
    """
    if row["sodium_mg"] >= 500:
        return "high_sodium_food"

    if row["sugar_g"] >= 15:
        return "high_sugar_food"

    if row["fat_g"] >= 25:
        return "high_fat_food"

    if row["protein_g"] >= 15:
        return "high_protein_food"

    if row["fiber_g"] >= 5 and row["calories"] <= 300:
        return "healthy_high_fiber_food"

    if row["calories"] <= 200:
        return "low_calorie_food"

    return "balanced_food"


def clean_nutrition_dataset(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df = df.drop_duplicates()

    # Remove unnecessary unnamed column if exists
    if "Unnamed: 0" in df.columns:
        df = df.drop(columns=["Unnamed: 0"])

    # Keep rows with food name
    df = df.dropna(subset=["name"])

    # Create clean columns
    clean_df = pd.DataFrame()

    clean_df["food_name"] = df["name"].astype(str).str.strip()
    clean_df["serving_size"] = df["serving_size"].astype(str).str.strip()

    clean_df["calories"] = df["calories"].apply(extract_number)

    clean_df["protein_g"] = df["protein"].apply(extract_number)
    clean_df["carbohydrate_g"] = df["carbohydrate"].apply(extract_number)
    clean_df["fat_g"] = df["fat"].apply(extract_number)
    clean_df["total_fat_g"] = df["total_fat"].apply(extract_number)
    clean_df["saturated_fat_g"] = df["saturated_fat"].apply(extract_number)

    clean_df["fiber_g"] = df["fiber"].apply(extract_number)
    clean_df["sugar_g"] = df["sugars"].apply(extract_number)

    clean_df["cholesterol_mg"] = df["cholesterol"].apply(extract_number)
    clean_df["sodium_mg"] = df["sodium"].apply(extract_number)

    clean_df["calcium_mg"] = df["calcium"].apply(extract_number)
    clean_df["potassium_mg"] = df["potassium"].apply(extract_number)
    clean_df["vitamin_c_mg"] = df["vitamin_c"].apply(extract_number)
    clean_df["caffeine_mg"] = df["caffeine"].apply(extract_number)
    clean_df["water_g"] = df["water"].apply(extract_number)

    # Valid food records only
    clean_df = clean_df[
        (clean_df["calories"] >= 0)
        & (clean_df["calories"] <= 1500)
        & (clean_df["protein_g"] >= 0)
        & (clean_df["carbohydrate_g"] >= 0)
        & (clean_df["fat_g"] >= 0)
    ]

    clean_df["nutrition_score"] = clean_df.apply(calculate_nutrition_score, axis=1)
    clean_df["food_label"] = clean_df.apply(create_food_label, axis=1)

    return clean_df


def main():
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV file not found: {CSV_PATH}")

    print("Reading nutrition dataset...")
    df = pd.read_csv(CSV_PATH)

    print("Cleaning nutrition dataset...")
    clean_df = clean_nutrition_dataset(df)

    client = MongoClient(settings.MONGO_URI)
    db = client[settings.DATABASE_NAME]

    collection = db["nutrition_dataset"]

    # Remove old data and insert new data
    collection.delete_many({})

    records = clean_df.to_dict("records")

    if records:
        collection.insert_many(records)

    print()
    print("Nutrition dataset inserted successfully")
    print("Database:", settings.DATABASE_NAME)
    print("Collection: nutrition_dataset")
    print("Total records inserted:", len(records))

    print()
    print("Food label count:")
    print(clean_df["food_label"].value_counts())

    print()
    print("Sample records:")
    print(clean_df.head(5))

    client.close()


if __name__ == "__main__":
    main()