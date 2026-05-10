from pydantic import BaseModel


class RoomBase(BaseModel):
    name: str
    capacity: int
    x: float
    y: float
    w: float
    h: float
    kind: str = "medium"
    amenities: list[str] = []


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    name: str | None = None
    capacity: int | None = None
    x: float | None = None
    y: float | None = None
    w: float | None = None
    h: float | None = None
    kind: str | None = None
    amenities: list[str] | None = None


class RoomRead(RoomBase):
    id: str
    floor_id: str

    model_config = {"from_attributes": True}
