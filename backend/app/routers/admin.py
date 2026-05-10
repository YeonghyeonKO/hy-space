from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.campus import Floor
from app.models.seat import Seat
from app.models.reservation import Reservation
from app.services.seed import seed_database

router = APIRouter(prefix="/api/v1", tags=["admin"])


@router.get("/admin/stats/{floor_id}")
async def get_stats(floor_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Floor).where(Floor.id == floor_id))
    floor = result.scalar_one_or_none()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")

    total_seats = len(floor.seats)
    result = await db.execute(
        select(func.count(Reservation.id))
        .where(Reservation.floor_id == floor_id, Reservation.status == "confirmed")
    )
    active_reservations = result.scalar() or 0
    occupancy = active_reservations / max(total_seats, 1)

    return {
        "floor_id": floor_id,
        "total_seats": total_seats,
        "total_rooms": len(floor.rooms),
        "active_reservations": active_reservations,
        "occupancy_pct": round(occupancy * 100, 1),
        "hourly_occupancy": [42, 68, 78, 35, 64, 88, 92, 84, 70, 38],
        "hours": ["09", "10", "11", "12", "13", "14", "15", "16", "17", "18"],
    }


@router.get("/admin/activity")
async def get_activity(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Reservation).order_by(Reservation.created_at.desc()).limit(10)
    )
    reservations = result.scalars().all()
    activities = []
    for r in reservations:
        activities.append({
            "user_id": r.user_id,
            "kind": r.kind,
            "target_id": r.target_id,
            "floor_id": r.floor_id,
            "status": r.status,
            "date": str(r.date),
            "created_at": str(r.created_at),
        })
    return activities


@router.post("/seed")
async def seed(db: AsyncSession = Depends(get_db)):
    if not settings.DEV_MODE:
        raise HTTPException(status_code=403, detail="Seed only available in dev mode")
    await seed_database(db)
    return {"ok": True, "message": "Database seeded with demo data"}
