from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.campus import Floor
from app.models.seat import Seat
from app.models.room import Room
from app.models.zone import Zone
from app.schemas.seat import SeatRead, SeatCreate
from app.schemas.room import RoomRead, RoomCreate
from app.schemas.zone import ZoneRead, ZoneCreate

router = APIRouter(prefix="/api/v1", tags=["floors"])


class FloorDetailRead(BaseModel):
    id: str
    name: str
    label: str
    affiliation: str
    view_box: str
    seats: list[SeatRead] = []
    rooms: list[RoomRead] = []
    zones: list[ZoneRead] = []

    model_config = {"from_attributes": True}


class LayoutSave(BaseModel):
    seats: list[SeatCreate] = []
    rooms: list[RoomCreate] = []
    zones: list[ZoneCreate] = []


@router.get("/floors/{floor_id}", response_model=FloorDetailRead)
async def get_floor(floor_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Floor).where(Floor.id == floor_id))
    floor = result.scalar_one_or_none()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")

    building = floor.building
    name = f"{floor.label} · {floor.description or ''}"

    return FloorDetailRead(
        id=floor.id,
        name=name,
        label=floor.label,
        affiliation=floor.affiliation,
        view_box=floor.view_box,
        seats=[SeatRead.model_validate(s) for s in floor.seats],
        rooms=[RoomRead.model_validate(r) for r in floor.rooms],
        zones=[ZoneRead.model_validate(z) for z in floor.zones],
    )


@router.put("/floors/{floor_id}/layout")
async def save_layout(floor_id: str, layout: LayoutSave, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Floor).where(Floor.id == floor_id))
    floor = result.scalar_one_or_none()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")

    # Delete existing layout elements
    await db.execute(delete(Seat).where(Seat.floor_id == floor_id))
    await db.execute(delete(Room).where(Room.floor_id == floor_id))
    await db.execute(delete(Zone).where(Zone.floor_id == floor_id))

    # Insert new ones
    for s in layout.seats:
        db.add(Seat(floor_id=floor_id, **s.model_dump()))
    for r in layout.rooms:
        db.add(Room(floor_id=floor_id, **r.model_dump()))
    for z in layout.zones:
        db.add(Zone(floor_id=floor_id, **z.model_dump()))

    await db.commit()
    return {"ok": True, "message": "Layout saved"}
