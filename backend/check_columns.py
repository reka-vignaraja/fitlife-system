import pandas as pd
from pathlib import Path

backend_dir = Path(__file__).parent

csv_files = list(backend_dir.rglob("*.csv"))

if not csv_files:
    print("No CSV dataset files found in backend folder.")
else:
    for file in csv_files:
        print("\n==============================")
        print("Dataset:", file)
        df = pd.read_csv(file)
        print("Rows:", len(df))
        print("Columns:")
        print(df.columns.tolist())
        print("==============================")