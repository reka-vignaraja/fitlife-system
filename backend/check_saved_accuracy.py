import joblib
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

model_files = [
    BASE_DIR / "app" / "models" / "fitlife_health_risk_model.pkl",
    BASE_DIR / "app" / "models" / "fitlife_sleep_risk_model.pkl",
]


def print_model_accuracy(model_path: Path):
    print("\n========================================")
    print("MODEL FILE:", model_path.name)
    print("========================================")

    if not model_path.exists():
        print("ERROR: Model file not found:", model_path)
        return

    data = joblib.load(model_path)

    if not isinstance(data, dict):
        print("This model file does not contain saved metadata.")
        return

    print("Model Name:", data.get("model_name", "Not available"))
    print("Best Algorithm:", data.get("best_algorithm", "Not available"))
    print("Target Column:", data.get("target_column", "Not available"))

    accuracy = data.get("accuracy")
    if accuracy is not None:
        print(f"Saved Accuracy: {accuracy * 100:.2f}%")
    else:
        print("Saved Accuracy: Not available")

    model_comparison = data.get("model_comparison")

    if model_comparison:
        print("\nModel Comparison Results:")
        for model_name, result in model_comparison.items():
            print("--------------------------------")
            print("Model:", model_name)

            if isinstance(result, dict):
                for key, value in result.items():
                    if isinstance(value, float):
                        if key.lower() in ["accuracy", "precision", "recall", "f1", "f1_score"]:
                            print(f"{key}: {value * 100:.2f}%")
                        else:
                            print(f"{key}: {value}")
                    else:
                        print(f"{key}: {value}")
            else:
                print(result)

    print("\nAccuracy checking completed.")


def main():
    for model_file in model_files:
        print_model_accuracy(model_file)


if __name__ == "__main__":
    main()