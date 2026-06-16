from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.core.rbac import get_current_user
from app.models.user import User
from app.models.alert import Alert
from app.models.push_subscription import PushSubscription
from pydantic import BaseModel

class PushSubscriptionIn(BaseModel):
    endpoint: str
    p256dh: str
    auth: str

from app.core.config import settings

router = APIRouter(prefix="/alerts", tags=["Alerts & Notifications"])

@router.get("/vapid-public-key")
async def get_vapid_public_key():
    return {"public_key": settings.VAPID_PUBLIC_KEY}


@router.get("/", response_model=List[dict])
async def list_my_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alerts = db.query(Alert).filter(Alert.user_id == current_user.id).order_by(Alert.created_at.desc()).limit(20).all()
    return [
        {
            "id": str(a.id),
            "type": a.type,
            "category": getattr(a, "category", None),
            "title": getattr(a, "title", "Notification"),
            "message": a.message,
            "action_url": getattr(a, "action_url", "/"),
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

@router.post("/subscribe")
async def subscribe_push(
    sub: PushSubscriptionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(PushSubscription).filter(
        PushSubscription.endpoint == sub.endpoint
    ).first()
    if existing:
        return {"success": True, "status": "already_subscribed"}
    db.add(PushSubscription(
        user_id=current_user.id,
        endpoint=sub.endpoint,
        p256dh=sub.p256dh,
        auth=sub.auth,
    ))
    db.commit()
    return {"success": True, "status": "subscribed"}

@router.delete("/subscribe")
async def unsubscribe_push(
    sub: PushSubscriptionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(PushSubscription).filter(
        PushSubscription.endpoint == sub.endpoint,
        PushSubscription.user_id == current_user.id,
    ).delete()
    db.commit()
    return {"success": True}

@router.put("/read-all")
async def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Alert).filter(
        Alert.user_id == current_user.id, Alert.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"success": True}

@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(Alert).filter(
        Alert.id == alert_id, Alert.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"success": True}
