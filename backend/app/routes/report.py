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
