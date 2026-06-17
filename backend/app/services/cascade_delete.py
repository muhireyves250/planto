"""
Manual cascade cleanup for deletes that cross model boundaries SQLAlchemy
relationship cascades don't cover (cross-aggregate FKs: Alert, Recommendation,
Prediction, AgronomistOverride, SystemLog, etc.).

PlantedCrop -> SoilMonitoring/CropHealthHistory/FertilizerPlan cascade is
handled by the ORM relationship cascade declared on PlantedCrop itself.
Everything here is the cleanup ORM cascade does NOT reach.
"""
from sqlalchemy.orm import Session

from app.models.planted_crop import PlantedCrop
from app.models.alert import Alert
from app.models.recommendation import Recommendation
from app.models.prediction import Prediction
from app.models.fertilizer import AgronomistOverride
from app.models.system import SystemLog
from app.models.soil_monitoring import SoilMonitoring
from app.models.farm import Farm, FarmMember, ManagedFarmer
from app.models.user import AuthSession
from app.models.push_subscription import PushSubscription


def delete_planted_crop_cascade(db: Session, crop: PlantedCrop) -> None:
    """Delete a planted crop plus everything that references it but isn't an ORM-cascaded child."""
    fp_ids = [fp.id for fp in crop.fertilizer_plans]
    if fp_ids:
        db.query(AgronomistOverride).filter(AgronomistOverride.fertilizer_plan_id.in_(fp_ids)).delete(synchronize_session=False)
    db.query(Alert).filter(Alert.plant_id == crop.id).update({"plant_id": None})
    db.query(Recommendation).filter(Recommendation.plant_id == crop.id).delete(synchronize_session=False)
    db.delete(crop)  # cascades monitoring_data, health_history, fertilizer_plans


def delete_farm_cascade(db: Session, farm: Farm) -> None:
    """Delete a farm plus every planted crop on it and anything else that points at it."""
    crops = db.query(PlantedCrop).filter(PlantedCrop.farm_id == farm.id).all()
    for crop in crops:
        delete_planted_crop_cascade(db, crop)

    db.query(Prediction).filter(Prediction.farm_id == farm.id).update({"farm_id": None})
    db.query(FarmMember).filter(FarmMember.farm_id == farm.id).delete(synchronize_session=False)
    db.query(ManagedFarmer).filter(ManagedFarmer.farm_id == farm.id).update({"farm_id": None})
    db.delete(farm)


def delete_user_cascade(db: Session, user) -> None:
    """Delete a user plus every farm they own and every record that points at them."""
    owned_farms = db.query(Farm).filter(Farm.owner_id == user.id).all()
    for farm in owned_farms:
        delete_farm_cascade(db, farm)

    # Farms they merely advise on (not owned) survive — just unassign the agronomist
    db.query(Farm).filter(Farm.agronomist_id == user.id).update({"agronomist_id": None})

    # Any crops left pointing at this user directly (not caught via farm above)
    remaining_crops = db.query(PlantedCrop).filter(PlantedCrop.user_id == user.id).all()
    for crop in remaining_crops:
        delete_planted_crop_cascade(db, crop)

    db.query(Prediction).filter(Prediction.user_id == user.id).delete(synchronize_session=False)
    db.query(Alert).filter(Alert.user_id == user.id).delete(synchronize_session=False)
    db.query(PushSubscription).filter(PushSubscription.user_id == user.id).delete(synchronize_session=False)
    db.query(AuthSession).filter(AuthSession.user_id == user.id).delete(synchronize_session=False)
    db.query(ManagedFarmer).filter(ManagedFarmer.agronomist_id == user.id).delete(synchronize_session=False)
    db.query(FarmMember).filter(FarmMember.user_id == user.id).delete(synchronize_session=False)
    db.query(SoilMonitoring).filter(SoilMonitoring.recorded_by == user.id).update({"recorded_by": None})
    db.query(SystemLog).filter(SystemLog.user_id == user.id).update({"user_id": None})
    db.query(Recommendation).filter(Recommendation.created_by == user.id).update({"created_by": None})
    db.query(AgronomistOverride).filter(AgronomistOverride.overridden_by == user.id).update({"overridden_by": None})

    db.delete(user)  # UserProfile cascades via DB-level ON DELETE CASCADE
