from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import role_required
from app.models.user import User
from app.models.farm import Farm
from app.models.planted_crop import PlantedCrop

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/overview")
async def admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["admin"])),
):
    farms = db.query(Farm).all()
    users = db.query(User).all()
    crops = db.query(PlantedCrop).all()

    farmers = [u for u in users if u.role == "farmer"]
    agronomists = [u for u in users if u.role == "agronomist"]

    farm_pins = []
    for f in farms:
        if f.location_lat and f.location_lng:
            owner = next((u for u in users if u.id == f.owner_id), None)
            farm_crops = [c for c in crops if c.farm_id == f.id]
            farm_pins.append({
                "id": str(f.id),
                "name": f.farm_name,
                "lat": f.location_lat,
                "lng": f.location_lng,
                "owner": owner.full_name if owner else "Unknown",
                "crop_count": len(farm_crops),
                "size": f.farm_size,
            })

    recent_users = sorted(users, key=lambda u: u.created_at, reverse=True)[:5]

    return {
        "stats": {
            "total_users": len(users),
            "farmers": len(farmers),
            "agronomists": len(agronomists),
            "total_farms": len(farms),
            "mapped_farms": len(farm_pins),
            "total_crops": len(crops),
        },
        "farm_pins": farm_pins,
        "recent_users": [
            {
                "id": str(u.id),
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "joined": u.created_at.isoformat(),
            }
            for u in recent_users
        ],
    }
