from sqlalchemy.orm import Session
from uuid import UUID
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionCreate

def create_prediction(db: Session, prediction: PredictionCreate):
    db_prediction = Prediction(
        user_id=prediction.user_id,
        farm_id=prediction.farm_id,
        n=prediction.n,
        p=prediction.p,
        k=prediction.k,
        temperature=prediction.temperature,
        humidity=prediction.humidity,
        ph=prediction.ph,
        rainfall=prediction.rainfall,
        predicted_crop=prediction.predicted_crop,
        confidence=prediction.confidence
    )
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)
    return db_prediction

def get_predictions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Prediction).order_by(Prediction.created_at.desc()).offset(skip).limit(limit).all()

def get_user_predictions(db: Session, user_id: UUID, limit: int = 100):
    return db.query(Prediction).filter(Prediction.user_id == user_id).order_by(Prediction.created_at.desc()).limit(limit).all()
