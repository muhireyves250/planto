import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import pickle
import os

# Set paths
DATA_PATH = r"d:\AI\Crop_recommendation_combined.csv"
MODEL_PATH = r"d:\AI\model.pkl"

def main():
    print("--- AI-Based Soil Testing and Crop Recommendation System ---")
    print("1. Loading Data...")
    if not os.path.exists(DATA_PATH):
        print(f"Error: Dataset not found at {DATA_PATH}")
        return
        
    df = pd.read_csv(DATA_PATH)
    print(f"Dataset Shape: {df.shape}")
    
    print("\n2. Exploratory Data Analysis (EDA)...")
    print("Missing Values per feature:")
    print(df.isnull().sum())
    
    print("\nTarget Class Distribution:")
    print(df['label'].value_counts())
    
    print("\nFeature Descriptive Statistics:")
    print(df.describe())
    
    # Save a correlation heatmap for numerical features
    print("\nGenerating Correlation Heatmap...")
    numeric_df = df.drop('label', axis=1)
    plt.figure(figsize=(10, 8))
    sns.heatmap(numeric_df.corr(), annot=True, cmap='coolwarm', fmt='.2f')
    plt.title('Correlation Matrix of Soil and Environment Features')
    plt.tight_layout()
    plt.savefig(r"d:\AI\correlation_heatmap.png")
    print("Saved correlation_heatmap.png")
    
    print("\n3. Data Preprocessing & Splitting...")
    # Features (N, P, K, temperature, humidity, ph, rainfall)
    X = df.drop('label', axis=1)
    y = df['label'] # Target
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Training data shape: {X_train.shape}")
    print(f"Testing data shape: {X_test.shape}")
    
    print("\n4. Model Training (Random Forest)...")
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)
    print("Training Complete.")
    
    print("\n5. Model Evaluation...")
    y_pred = rf_model.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy Score: {acc * 100:.2f}%")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    print("\n6. Saving the Model...")
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(rf_model, f)
    print(f"Model saved successfully to {MODEL_PATH}")

if __name__ == "__main__":
    main()
