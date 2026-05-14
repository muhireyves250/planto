# AI-Based Soil Testing and Crop Recommendation System (Rwanda)

This project implements a machine learning system to analyze soil conditions and recommend suitable crops for precision farming in Rwanda.

## Features
- **Exploratory Data Analysis (EDA)**: Detailed statistical analysis of soil and environmental features.
- **Machine Learning Model**: Uses Random Forest classification for high-accuracy crop recommendations.
- **API-Ready Prediction**: Modular prediction script for easy backend integration.
- **Virtual Environment Setup**: Standardized dependency management with `venv`.

## Prerequisites
- Python 3.9+
- Pip

## Project Structure
- `eda_and_training.py`: Handles data loading, EDA, training, and model saving.
- `predict.py`: Provides the `predict_crop` function for real-time recommendations.
- `Crop_recommendation.csv`: Primary dataset containing N, P, K, pH, rainfall, and climate data.
- `model.pkl`: The serialized trained Random Forest model.
- `requirements.txt`: Python dependencies.
- `correlation_heatmap.png`: Visualization of feature correlations.

## Setup and Usage

### 1. Initialize Virtual Environment
```bash
python -m venv venv
.\venv\Scripts\activate    # Windows
source venv/bin/activate  # Linux/Mac
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Train the Model
```bash
python eda_and_training.py
```

### 4. Run a Sample Prediction
```bash
python predict.py
```

### 5. Start the FastAPI Backend Server
Navigate to the `backend` folder and start the API using Uvicorn:
```bash
cd backend
python api.py
```
Or running it via Uvicorn directly:
```bash
cd backend
uvicorn api:app --reload
```
The server will start at `http://0.0.0.0:8000` (or `http://localhost:8000`).

## Input Features
The model requires the following inputs for a prediction:
- **N**: Nitrogen content (ratio) in soil
- **P**: Phosphorus content (ratio) in soil
- **K**: Potassium content (ratio) in soil
- **Temperature**: (°C)
- **Humidity**: (%)
- **pH**: Soil pH value (0-14)
- **Rainfall**: (mm)

## Next Steps
- **Fertilizer Recommendation**: Can be implemented by comparing soil NPK against target crop NPK requirements.
- **IoT Integration**: Data can be streamed via MQTT from ESP32/Arduino soil sensors.
