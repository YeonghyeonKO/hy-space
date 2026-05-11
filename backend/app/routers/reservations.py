from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import get_current_user
from app.models.reservation import Reservation
from app.models.user import User, Affiliation
from app.models.campus import Floor
from app.schemas.reservation import ReservationCreate, ReservationRead

router = APIRouter(prefix="/api/v1", tags=["reservations"])


@router.get("/reservations/my", response_model=list[ReservationRead])
async def my_reservations(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Reservation)
        .where(Reservation.user_id == user.id)
        .order_by(Reservation.date.desc(), Reservation.start_time)
    )
    return result.scalars().all()


@router.get("/reservations", response_model=list[ReservationRead])
async def list_reservations(
    floor_id: str = Query(...),
    date: date_type = Query(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Reservation)
        .where(Reservation.floor_id == floor_id, Reservation.date == date)
        .order_by(Reservation.start_time)
    )
    return result.scalars().all()


@router.post("/reservations", response_model=ReservationRead)
async def create_reservation(
    data: ReservationCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Check affiliation access
    result = await db.execute(
        select(Affiliation).where(Affiliation.name == user.affiliation)
    )
    aff = result.scalar_one_or_none()

    result = await db.execute(select(Floor).where(Floor.id == data.floor_id))
    floor = result.scalar_one_or_none()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")

    if aff and floor.label not in aff.bookable_floors:
        raise HTTPException(
            status_code=403,
            detail=f"Your affiliation ({user.affiliation}) cannot book on {floor.label}"
        )

    reservation = Reservation(
        user_id=user.id,
        kind=data.kind,
        target_id=data.target_id,
        floor_id=data.floor_id,
        date=data.date,
        start_time=data.start_time,
        end_time=data.end_time,
        title=data.title,
        attendees=data.attendees,
        status="confirmed",
    )
    db.add(reservation)
    await db.commit()
    await db.refresh(reservation)
    return reservation


@router.delete("/reservations/{reservation_id}")
async def cancel_reservation(
    reservation_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Reservation).where(Reservation.id == reservation_id)
    )
    res = result.scalar_one_or_none()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if res.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your reservation")

    res.status = "cancelled"
    await db.commit()
    return {"ok": True, "message": "Reservation cancelled"}
