from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.core.rbac import get_current_user
from app.models.user import User
from app.models.alert import Alert

router = APIRouter(prefix="/alerts", tags=["Alerts & Notifications"])

@router.get("/", response_model=List[dict])
async def list_my_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alerts = db.query(Alert).filter(Alert.user_id == current_user.id).order_by(Alert.created_at.desc()).all()
    return [
        {
            "id": str(a.id),
            "type": a.type,
            "message": a.message,
            "is_read": a.is_read,
            "created_at": a.created_at,
            "plant_id": str(a.plant_id) if a.plant_id else None
        } for a in alerts
    ]

@router.put("/{alert_id}/read")
async def mark_alert_read(alert_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"success": True}
