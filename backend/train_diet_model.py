from pathlib import Path
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "diet_recommendations_dataset.csv"
MODEL_DIR = BASE_DIR / "app" / "models"
MODEL_PATH = MODEL_DIR / "fitlife_diet_recommendation_model.pkl"

TARGET_COLUMN = "Diet_Recommendation"


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    print("Reading diet recommendation dataset...")
    df = pd.read_csv(DATA_PATH)

    print("Original rows:", len(df))
    print("Original columns:", df.columns.tolist())

    # Remove duplicate rows
    df = df.drop_duplicates()

    # Drop ID column because it is not useful for prediction
    if "Patient_ID" in df.columns:
        df = df.drop(columns=["Patient_ID"])

    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Target column not found: {TARGET_COLUMN}")

    # Remove rows where target is missing
    df = df.dropna(subset=[TARGET_COLUMN])

    X = df.drop(columns=[TARGET_COLUMN])
    y = df[TARGET_COLUMN]

    numeric_features = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
    categorical_features = X.select_dtypes(include=["object"]).columns.tolist()

    print("\nNumeric features:")
    print(numeric_features)

    print("\nCategorical features:")
    print(categorical_features)

    print("\nTarget classes:")
    print(y.value_counts())

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", numeric_transformer, numeric_features),
            ("categorical", categorical_transformer, categorical_features),
        ]
    )

    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Decision Tree": DecisionTreeClassifier(random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=200, random_state=42),
    }

    model_comparison = {}
    best_model_name = None
    best_accuracy = 0
    best_pipeline = None
    best_report = None
    best_confusion_matrix = None

    print("\nTraining and evaluating models...")

    for model_name, model in models.items():
        pipeline = Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("model", model),
            ]
        )

        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)

        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

        model_comparison[model_name] = {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
        }

        print("\n--------------------------------")
        print("Model:", model_name)
        print(f"Accuracy: {accuracy * 100:.2f}%")
        print(f"Precision: {precision * 100:.2f}%")
        print(f"Recall: {recall * 100:.2f}%")
        print(f"F1-score: {f1 * 100:.2f}%")

        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_model_name = model_name
            best_pipeline = pipeline
            best_report = classification_report(y_test, y_pred, zero_division=0)
            best_confusion_matrix = confusion_matrix(y_test, y_pred).tolist()

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    saved_data = {
        "pipeline": best_pipeline,
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "target_column": TARGET_COLUMN,
        "model_name": "FitLife Diet Recommendation Model",
        "best_algorithm": best_model_name,
        "accuracy": best_accuracy,
        "model_comparison": model_comparison,
        "classification_report": best_report,
        "confusion_matrix": best_confusion_matrix,
        "classes": sorted(y.unique().tolist()),
    }

    joblib.dump(saved_data, MODEL_PATH)

    print("\n========================================")
    print("Diet Recommendation Model Training Completed")
    print("========================================")
    print("Best Algorithm:", best_model_name)
    print(f"Best Accuracy: {best_accuracy * 100:.2f}%")
    print("Model saved at:", MODEL_PATH)

    print("\nBest Model Classification Report:")
    print(best_report)

    print("\nBest Model Confusion Matrix:")
    print(best_confusion_matrix)


if __name__ == "__main__":
    main()