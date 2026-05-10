from pydantic import BaseModel


class ZoneBase(BaseModel):
    kind: str
    label: str
    x: float
    y: float
    w: float
    h: float


class ZoneCreate(ZoneBase):
    pass


class ZoneUpdate(BaseModel):
    kind: str | None = None
    label: str | None = None
    x: float | None = None
    y: float | None = None
    w: float | None = None
    h: float | None = None


class ZoneRead(ZoneBase):
    id: str
    floor_id: str

    model_config = {"from_attributes": True}
