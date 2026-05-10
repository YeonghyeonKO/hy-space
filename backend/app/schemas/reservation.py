from datetime import date

from pydantic import BaseModel


class ReservationCreate(BaseModel):
    kind: str  # seat or room
    target_id: str
    floor_id: str
    date: date
    start_time: str
    end_time: str
    title: str | None = None
    attendees: int | None = None


class ReservationRead(BaseModel):
    id: str
    user_id: str
    kind: str
    target_id: str
    floor_id: str
    date: date
    start_time: str
    end_time: str
    title: str | None = None
    attendees: int | None = None
    status: str

    model_config = {"from_attributes": True}
