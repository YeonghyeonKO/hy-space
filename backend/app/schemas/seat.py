from pydantic import BaseModel


class SeatBase(BaseModel):
    label: str
    x: float
    y: float
    w: float = 36.0
    h: float = 32.0
    facing: str = "up"
    group_name: str | None = None


class SeatCreate(SeatBase):
    pass


class SeatUpdate(BaseModel):
    label: str | None = None
    x: float | None = None
    y: float | None = None
    w: float | None = None
    h: float | None = None
    facing: str | None = None
    group_name: str | None = None


class SeatRead(SeatBase):
    id: str
    floor_id: str

    model_config = {"from_attributes": True}
