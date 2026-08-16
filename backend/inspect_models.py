import joblib
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

model_files = [
    BASE_DIR / "app" / "models" / "fitlife_health_risk_model.pkl",
    BASE_DIR / "app" / "models" / "fitlife_sleep_risk_model.pkl",
]


def inspect_model(model_path: Path):
    print("\n========================================")
    print("MODEL FILE:", model_path)
    print("========================================")

    if not model_path.exists():
        print("ERROR: Model file not found")
        return

    loaded_object = joblib.load(model_path)

    print("Loaded object type:", type(loaded_object))

    # Some models are saved directly.
    # Some are saved as dictionary: {"model": ..., "accuracy": ...}
    if isinstance(loaded_object, dict):
        print("\nDictionary keys:")
        print(list(loaded_object.keys()))

        for key, value in loaded_object.items():
            print(f"{key}: {type(value)}")

        if "model" in loaded_object:
            model = loaded_object["model"]
        elif "pipeline" in loaded_object:
            model = loaded_object["pipeline"]
        else:
            print("No direct model/pipeline key found.")
            return
    else:
        model = loaded_object

    print("\nModel / Pipeline type:", type(model))

    # If it is a pipeline, show pipeline steps
    if hasattr(model, "steps"):
        print("\nPipeline steps:")
        for step_name, step_object in model.steps:
            print(f"- {step_name}: {type(step_object)}")

        final_model = model.steps[-1][1]
    else:
        final_model = model

    print("\nFinal estimator type:", type(final_model))

    # Show classes if classification model
    if hasattr(final_model, "classes_"):
        print("\nPrediction classes:")
        print(final_model.classes_)

    # Show input features if available
    if hasattr(model, "feature_names_in_"):
        print("\nFeature names expected by model:")
        print(model.feature_names_in_)

    if hasattr(final_model, "feature_names_in_"):
        print("\nFeature names expected by final estimator:")
        print(final_model.feature_names_in_)

    # Show feature importance if available
    if hasattr(final_model, "feature_importances_"):
        print("\nFeature importance available: Yes")
        print("Number of feature importances:", len(final_model.feature_importances_))
    else:
        print("\nFeature importance available: No")

    print("\nModel inspection completed successfully.")


def main():
    for model_file in model_files:
        inspect_model(model_file)


if __name__ == "__main__":
    main()