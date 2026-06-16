from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import get_current_user
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/send-email")
async def send_report_email_on_demand(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send the weekly farm report to the authenticated farmer's inbox immediately."""
    if current_user.role != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can request a personal report")

    from app.services.report_service import get_farmer_report_data
    from app.services.email_service import send_report_email

    report_data = get_farmer_report_data(current_user.id, db)
    await send_report_email(
        to_email=current_user.email,
        full_name=current_user.full_name,
        report_data=report_data,
    )
    return {"success": True, "message": f"Report sent to {current_user.email}"}


@router.post("/send-farmer-report/{farm_id}")
async def send_farmer_report_from_agronomist(
    farm_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Agronomist sends a farm report to the managed farmer's email on demand."""
    if current_user.role != "agronomist":
        raise HTTPException(status_code=403, detail="Only agronomists can use this endpoint")

    from app.models.farm import Farm, ManagedFarmer
    from app.services.report_service import get_farm_report_data
    from app.services.email_service import send_report_email

    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.agronomist_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found or not managed by you")

    managed = db.query(ManagedFarmer).filter(ManagedFarmer.farm_id == farm_id).first()
    if not managed or not managed.email:
        raise HTTPException(status_code=422, detail="This farmer has no email address on file")

    report_data = get_farm_report_data(farm_id, db)
    await send_report_email(
        to_email=managed.email,
        full_name=managed.full_name,
        report_data=report_data,
    )
    return {"success": True, "message": f"Report sent to {managed.email}"}
