import pandas as pd
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "Crop_recommendation_combined.csv")
OUT_PATH = os.path.join(BASE_DIR, "Crop_recommendation_sensor.csv")

def synthesize_parameters(df):
    # Formulas for generating realistic EC and Soil Moisture
    # EC depends on N, P, K dissolved salts. Typical range: 0.2 to 2.5 dS/m for agricultural soil
    # Base salinity roughly ~ 0.5 dS/m, plus salt load from N, P, K.
    base_ec = 0.5
    
    # Calculate synthetic EC using N, P, K + Random noise
    # The coefficients are approximations representing the salt index of typical N, P, K fertilizers
    df['ec'] = base_ec + (df['n'] * 0.005) + (df['p'] * 0.002) + (df['k'] * 0.004)
    # Add 10% Gaussian noise for realism
    noise_ec = np.random.normal(0, df['ec'].mean() * 0.1, len(df))
    df['ec'] += noise_ec
    df['ec'] = df['ec'].clip(lower=0.1).round(2)
    
    # Calculate synthetic Soil Moisture based on Rainfall and Humidity.
    # Generally, Soil Moisture % = 0.3 * Rainfall(mm) + 0.2 * Humidity(%) + base, capped at 100
    base_moisture = 10
    df['moisture'] = base_moisture + (df['rainfall'] * 0.25) + (df['humidity'] * 0.2)
    
    # Crop specific tuning logic: Some crops are aquatic (rice)
    df.loc[df['label'] == 'rice', 'moisture'] += 20
    df.loc[df['label'] == 'coconut', 'moisture'] += 10
    
    # Add 5% Gaussian noise
    noise_m = np.random.normal(0, df['moisture'].mean() * 0.05, len(df))
    df['moisture'] += noise_m
    df['moisture'] = df['moisture'].clip(lower=10, upper=100).round(1)
    
    # Drop the weather-based columns since we don't need them
    df = df.drop(columns=['humidity', 'rainfall'])
    
    return df

def main():
    if not os.path.exists(DATA_PATH):
        print(f"Error: Could not find original dataset at {DATA_PATH}")
        return
        
    print("Loading original dataset...")
    df = pd.read_csv(DATA_PATH)
    
    print("Synthesizing Electrical Conductivity (EC) and Soil Moisture...")
    df_new = synthesize_parameters(df)
    
    print("\nSample of new parameters mapping:")
    print(df_new[['n', 'p', 'k', 'temperature', 'ph', 'ec', 'moisture', 'label']].head())
    
    print(f"\nSaving generated dataset to {OUT_PATH}...")
    df_new.to_csv(OUT_PATH, index=False)
    print("Done!")

if __name__ == "__main__":
    main()
