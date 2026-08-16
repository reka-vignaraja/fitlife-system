from pathlib import Path
import sys

import joblib
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier


BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")

from app.core.config import settings


MODEL_DIR = BASE_DIR / "app" / "models"
MODEL_PATH = MODEL_DIR / "fitlife_health_risk_model.pkl"


# IMPORTANT:
# We do not use BMI, BP_Category, Cholesterol_Category, or Weight_Category.
# Because those columns can make prediction too easy.
NUMERIC_FEATURES = [
    "Height",
    "Weight",
    "Age",
    "Systolic_BP",
    "Diastolic_BP",
    "Cholesterol",
]

CATEGORICAL_FEATURES = [
    "Gender",
    "Activity_Level",
    "Smoker",
]

TARGET_COLUMN = "health_risk_level"


def build_pipeline(model):
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )

    return pipeline


def main():
    print("Starting FitLife Health Risk Model training...")

    client = MongoClient(settings.MONGO_URI)
    db = client[settings.DATABASE_NAME]

    records = list(db["health_dataset"].find({}, {"_id": 0}))

    if not records:
        raise ValueError(
            "No dataset found in MongoDB. Please run scripts/insert_dataset.py first."
        )

    df = pd.DataFrame(records)

    print("Dataset loaded successfully")
    print("Total records:", len(df))

    required_columns = NUMERIC_FEATURES + CATEGORICAL_FEATURES + [TARGET_COLUMN]

    missing_columns = [col for col in required_columns if col not in df.columns]

    if missing_columns:
        raise ValueError(f"Missing columns in dataset: {missing_columns}")

    df = df.dropna(subset=required_columns)

    print("Records after cleaning:", len(df))

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET_COLUMN]

    print()
    print("Target label count:")
    print(y.value_counts())

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    models = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=5,
            min_samples_leaf=20,
            random_state=42,
            class_weight="balanced",
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=120,
            max_depth=5,
            min_samples_leaf=20,
            random_state=42,
            class_weight="balanced",
        ),
    }

    results = {}

    best_model_name = None
    best_accuracy = 0
    best_pipeline = None
    best_predictions = None

    print()
    print("Model comparison:")

    for model_name, model in models.items():
        pipeline = build_pipeline(model)

        pipeline.fit(X_train, y_train)

        y_pred = pipeline.predict(X_test)

        accuracy = accuracy_score(y_test, y_pred)

        results[model_name] = round(accuracy, 4)

        print(f"{model_name}: {round(accuracy, 4)}")

        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_model_name = model_name
            best_pipeline = pipeline
            best_predictions = y_pred

    print()
    print("Best model:", best_model_name)
    print("Best accuracy:", round(best_accuracy, 4))

    print()
    print("Classification Report:")
    print(classification_report(y_test, best_predictions))

    print()
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, best_predictions))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    model_package = {
        "pipeline": best_pipeline,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target_column": TARGET_COLUMN,
        "model_name": "FitLife Health Risk Level Prediction Model",
        "best_algorithm": best_model_name,
        "accuracy": round(best_accuracy, 4),
        "model_comparison": results,
    }

    joblib.dump(model_package, MODEL_PATH)

    print()
    print("Model saved successfully")
    print("Model path:", MODEL_PATH)

    client.close()


if __name__ == "__main__":
    main()