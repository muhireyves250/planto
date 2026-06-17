import asyncio
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import httpx
from app.core.database import get_db
from app.core.rbac import role_required
from app.models.user import User
from app.models.farm import Farm
from app.models.planted_crop import PlantedCrop
from app.services.cascade_delete import delete_user_cascade, delete_farm_cascade
from app.core.rbac import invalidate_user_cache

router = APIRouter(prefix="/admin", tags=["Admin"])


async def _geocode(location_text: str) -> tuple[float, float] | None:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": location_text, "format": "json", "limit": 1},
                headers={"User-Agent": "Planto-Admin/1.0"},
            )
            results = r.json()
            if results:
                return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception:
        pass
    return None


@router.get("/overview")
async def admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["admin"])),
):
    # Single aggregation query for crop counts — avoids loading all crops into memory
    crop_counts: dict = {
        row.farm_id: row.count
        for row in db.query(PlantedCrop.farm_id, func.count(PlantedCrop.id).label("count"))
                      .group_by(PlantedCrop.farm_id)
                      .all()
    }
    total_crops = sum(crop_counts.values())

    farms = db.query(Farm).all()
    users = db.query(User).all()

    farmers    = [u for u in users if u.role == "farmer"]
    agronomists = [u for u in users if u.role == "agronomist"]
    admins     = [u for u in users if u.role == "admin"]
    user_map   = {u.id: u for u in users}

    # Identify farms that need geocoding
    farms_needing_geocode = [f for f in farms if (not f.location_lat or not f.location_lng) and f.location]

    # Geocode all missing farms concurrently
    if farms_needing_geocode:
        results = await asyncio.gather(*[_geocode(f.location) for f in farms_needing_geocode])
        db_dirty = False
        for f, coords in zip(farms_needing_geocode, results):
            if coords:
                f.location_lat, f.location_lng = coords
                db_dirty = True
        if db_dirty:
            db.commit()  # single commit for all geocoded farms

    farm_pins = []
    for f in farms:
        if f.location_lat and f.location_lng:
            owner = user_map.get(f.owner_id)
            farm_pins.append({
                "id": str(f.id),
                "name": f.farm_name,
                "lat": f.location_lat,
                "lng": f.location_lng,
                "owner": owner.full_name if owner else "Unknown",
                "crop_count": crop_counts.get(f.id, 0),
                "size": f.farm_size,
            })

    all_users_sorted = sorted(users, key=lambda u: u.created_at, reverse=True)
    all_farms_sorted = sorted(farms, key=lambda f: f.created_at, reverse=True)

    return {
        "stats": {
            "total_users": len(users),
            "farmers": len(farmers),
            "agronomists": len(agronomists),
            "admins": len(admins),
            "total_farms": len(farms),
            "mapped_farms": len(farm_pins),
            "total_crops": total_crops,
        },
        "farm_pins": farm_pins,
        "all_users": [
            {
                "id": str(u.id),
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "joined": u.created_at.isoformat(),
            }
            for u in all_users_sorted
        ],
        "all_farms": [
            {
                "id": str(f.id),
                "name": f.farm_name,
                "owner": user_map.get(f.owner_id).full_name if user_map.get(f.owner_id) else "Unknown",
                "location": f.location or ("GPS" if f.location_lat else "—"),
                "size": f.farm_size or "—",
                "soil_type": f.soil_type or "—",
                "crop_count": crop_counts.get(f.id, 0),
                "created_at": f.created_at.isoformat(),
            }
            for f in all_farms_sorted
        ],
    }


# ── Pending approvals ────────────────────────────────────────────

@router.get("/pending")
async def pending_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["admin"])),
):
    pending = db.query(User).filter(User.role == "agronomist", User.is_active == False).all()
    return [
        {
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "joined": u.created_at.isoformat(),
        }
        for u in pending
    ]


# ── User management ──────────────────────────────────────────────

@router.post("/users/{user_id}/approve")
async def approve_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["admin"])),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    return {"success": True}


@router.post("/users/{user_id}/reject")
async def reject_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["admin"])),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    delete_user_cascade(db, user)
    db.commit()
    invalidate_user_cache(user.email)
    return {"success": True}


@router.patch("/users/{user_id}")
async def update_user(
    user_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["admin"])),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own account here")
    allowed = {"is_active", "role"}
    for key, val in payload.items():
        if key in allowed:
            setattr(user, key, val)
    db.commit()
    if "is_active" in payload and not payload["is_active"]:
        invalidate_user_cache(user.email)
    return {"success": True}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["admin"])),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    delete_user_cascade(db, user)
    db.commit()
    invalidate_user_cache(user.email)
    return {"success": True}


# ── Farm management ──────────────────────────────────────────────

@router.delete("/farms/{farm_id}")
async def delete_farm(
    farm_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["admin"])),
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    delete_farm_cascade(db, farm)
    db.commit()
    return {"success": True}
