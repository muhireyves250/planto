import pandas as pd
import numpy as np
import os

# Paths
ORIGINAL_DATA = r"d:\AI\Crop_recommendation.csv"
NEW_DATA = r"d:\AI\Crop_recommendation_v2.csv"
COMBINED_DATA = r"d:\AI\Crop_recommendation_combined.csv"

def merge_datasets():
    print("--- Professional Data Integration Module ---")
    
    # Load original
    df1 = pd.read_csv(ORIGINAL_DATA)
    print(f"Original dataset loaded: {len(df1)} rows.")
    
    # Load new 69k dataset
    df2 = pd.read_csv(NEW_DATA)
    print(f"New dataset loaded: {len(df2)} rows (Expanded 69k version).")
    
    # 1. Column Alignment and Sanitization
    # Standardize to lowercase for matching
    df1.columns = [c.lower().strip() for c in df1.columns]
    df2.columns = [c.lower().strip() for c in df2.columns]
    
    # Keep only common columns
    common_cols = ['n', 'p', 'k', 'temperature', 'humidity', 'ph', 'rainfall', 'label']
    
    # Verify columns exist in both
    missing_df1 = [c for c in common_cols if c not in df1.columns]
    missing_df2 = [c for c in common_cols if c not in df2.columns]
    
    if missing_df1 or missing_df2:
        print(f"Warning: Columns missing. DF1: {missing_df1}, DF2: {missing_df2}")
        # Note: If temperature is missing in one but found in another (e.g. temp), fix it.
        # But based on head, they should be there.
    
    # Extract only relevant columns
    df1_clean = df1[common_cols]
    df2_clean = df2[common_cols]
    
    # 2. Merging
    combined = pd.concat([df1_clean, df2_clean], axis=0, ignore_index=True)
    initial_count = len(combined)
    
    # 3. Quality Control: Deduplication
    combined = combined.drop_duplicates()
    final_count = len(combined)
    
    print(f"Initial combined rows: {initial_count}")
    print(f"Rows after deduplication: {final_count}")
    print(f"Total rows added: {final_count - len(df1)}")
    
    # 4. Save Combined Dataset
    combined.to_csv(COMBINED_DATA, index=False)
    print(f"Saved integrated dataset to {COMBINED_DATA}")
    
    return COMBINED_DATA

if __name__ == "__main__":
    merge_datasets()
