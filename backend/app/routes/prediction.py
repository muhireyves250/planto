from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.core.rbac import get_current_user, get_current_user_optional
from app.models.user import User
from app.schemas import prediction as pred_schemas
from app.repositories import prediction_repo, farm_repo
from app.services.ml.predict import predict_crop

router = APIRouter(tags=["Prediction"])

@router.post("/predict", response_model=pred_schemas.PredictionResponse)
async def predict(
    data: pred_schemas.SoilFeatures, 
    user_id: Optional[UUID] = None,
    farm_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    try:
        # Override user_id if authenticated
        actual_user_id = current_user.id if current_user else user_id
        
        # Verify farm ownership if farm_id is provided and user is authenticated
        if farm_id and current_user:
            farm = farm_repo.get_farm_by_id(db, farm_id)
            if farm and farm.owner_id != current_user.id and current_user.role not in ["admin", "agronomist"]:
                raise HTTPException(status_code=403, detail="Not authorized to use this farm")

        crop, confidence, advice, status = predict_crop(
            n=data.n, p=data.p, k=data.k,
            temperature=data.temperature,
            humidity=data.humidity,
            ph=data.ph,
            rainfall=data.rainfall
        )
        
        prediction_record = pred_schemas.PredictionCreate(
            **data.model_dump(),
            user_id=actual_user_id,
            farm_id=farm_id,
            predicted_crop=crop,
            confidence=confidence
        )
        prediction_repo.create_prediction(db=db, prediction=prediction_record)

        return {
            "success": True,
            "crop": crop,
            "confidence": confidence,
            "advice": advice,
            "status": status
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/predictions", response_model=List[pred_schemas.PredictionDB])
async def read_predictions(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["admin", "agronomist"]:
        return prediction_repo.get_predictions(db, skip=skip, limit=limit)
    else:
        return prediction_repo.get_user_predictions(db, user_id=current_user.id, limit=limit)

@router.get("/user-predictions/{user_id}", response_model=List[pred_schemas.PredictionDB])
async def read_user_predictions(
    user_id: UUID, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    actual_user_id = current_user.id if current_user.role == "farmer" else user_id
    return prediction_repo.get_user_predictions(db, user_id=actual_user_id, limit=limit)
