import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pickle
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, accuracy_score
import os

# Set paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
DATA_PATH = os.path.join(BASE_DIR, "Crop_recommendation_combined.csv")

def main():
    print("--- Professional Accuracy Check (Visual Confusion Matrix) ---")
    
    # 1. Load Data and Model
    if not os.path.exists(DATA_PATH) or not os.path.exists(MODEL_PATH):
        print("Error: Required files (Data or Model) are missing.")
        return
        
    df = pd.read_csv(DATA_PATH)
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
        
    # 2. Prepare Testing Data
    df.columns = [c.lower() for c in df.columns]
    X = df.drop('label', axis=1)
    y = df['label']
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 3. Make Predictions
    y_pred = model.predict(X_test)
    
    # 4. Calculate Accuracy
    acc = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {acc * 100:.2f}%")
    
    # 5. Generate Confusion Matrix Plot
    print("\nGenerating Confusion Matrix Plot...")
    cm = confusion_matrix(y_test, y_pred)
    
    # Identify unique crop labels for the axis
    labels = sorted(df['label'].unique())
    
    plt.figure(figsize=(15, 12))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=labels, yticklabels=labels)
    
    plt.title(f'Confusion Matrix (Model Accuracy: {acc * 100:.2f}%)')
    plt.ylabel('Actual Crop Type')
    plt.xlabel('Predicted Crop Type')
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    # Save the plot
    output_filename = "confusion_matrix.png"
    plt.savefig(output_filename)
    print(f"Successfully saved plot to: {output_filename}")
    print("\nYou can now open this image to see how 'pro' your AI is!")

if __name__ == "__main__":
    main()
