from sqlalchemy.orm import Session
from models import Prediction, User
import schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_prediction(db: Session, prediction: schemas.PredictionCreate):

    db_prediction = Prediction(
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
    return db.query(Prediction).order_by(Prediction.timestamp.desc()).offset(skip).limit(limit).all()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def update_user_settings(db: Session, user_id: int, settings: schemas.UserSettingsUpdate):
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    
    update_data = settings.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user
