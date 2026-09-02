import joblib
from pathlib import Path

model_path = Path("app/models/fitlife_diet_recommendation_model.pkl")

print("=" * 50)
print("DIET MODEL CHECK")
print("=" * 50)

if not model_path.exists():
    print("Diet model file not found:", model_path)
    raise SystemExit

model_data = joblib.load(model_path)

print("Loaded object type:", type(model_data))

if isinstance(model_data, dict):
    print("\nDictionary keys:")
    print(list(model_data.keys()))

    print("\nModel Name:", model_data.get("model_name", "Not found"))
    print("Best Algorithm:", model_data.get("best_algorithm", "Not found"))
    print("Target Column:", model_data.get("target_column", "Not found"))

    accuracy = model_data.get("accuracy")

    if accuracy is not None:
        print(f"Saved Accuracy: {accuracy * 100:.2f}%")
    else:
        print("Saved Accuracy: Not found in model file")

    comparison = model_data.get("model_comparison")

    if comparison:
        print("\nModel Comparison Results:")
        for name, score in comparison.items():
            print("-" * 30)
            print("Model:", name)
            print(score)

    pipeline = model_data.get("pipeline")

    if pipeline is not None:
        print("\nPipeline type:", type(pipeline))

        if hasattr(pipeline, "steps"):
            print("\nPipeline steps:")
            for step_name, step_obj in pipeline.steps:
                print(f"- {step_name}: {type(step_obj)}")

            final_model = pipeline.steps[-1][1]
            print("\nFinal estimator type:", type(final_model))

            if hasattr(final_model, "classes_"):
                print("\nPrediction classes:")
                print(final_model.classes_)
else:
    print("Model object:", model_data)

print("\nDiet model checking completed.")