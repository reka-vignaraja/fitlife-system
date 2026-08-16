from pathlib import Path
import sys

import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")

from app.core.config import settings


CSV_PATH = BASE_DIR / "data" / "sleep_health_dataset.csv"


def clean_sleep_dataset(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df = df.dropna()
    df = df.drop_duplicates()

    # Valid range filtering
    df = df[
        (df["age"] >= 10)
        & (df["age"] <= 100)
        & (df["bmi"] >= 10)
        & (df["bmi"] <= 60)
        & (df["sleep_duration_hrs"] >= 0)
        & (df["sleep_duration_hrs"] <= 24)
        & (df["sleep_quality_score"] >= 0)
        & (df["sleep_quality_score"] <= 10)
        & (df["sleep_latency_mins"] >= 0)
        & (df["sleep_latency_mins"] <= 300)
        & (df["wake_episodes_per_night"] >= 0)
        & (df["stress_score"] >= 0)
        & (df["stress_score"] <= 10)
        & (df["heart_rate_resting_bpm"] >= 30)
        & (df["heart_rate_resting_bpm"] <= 150)
    ]

    text_columns = [
        "gender",
        "occupation",
        "country",
        "chronotype",
        "mental_health_condition",
        "season",
        "day_type",
        "sleep_disorder_risk",
    ]

    for col in text_columns:
        df[col] = df[col].astype(str).str.strip()

    return df


def main():
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV file not found: {CSV_PATH}")

    print("Reading sleep dataset...")
    df = pd.read_csv(CSV_PATH)

    print("Cleaning sleep dataset...")
    df = clean_sleep_dataset(df)

    client = MongoClient(settings.MONGO_URI)
    db = client[settings.DATABASE_NAME]

    collection = db["sleep_dataset"]

    collection.delete_many({})

    records = df.to_dict("records")

    if records:
        collection.insert_many(records)

    print()
    print("Sleep dataset inserted successfully")
    print("Database:", settings.DATABASE_NAME)
    print("Collection: sleep_dataset")
    print("Total records inserted:", len(records))

    print()
    print("Sleep disorder risk count:")
    print(df["sleep_disorder_risk"].value_counts())

    client.close()


if __name__ == "__main__":
    main()