from pydantic import BaseModel


class FloorRead(BaseModel):
    id: str
    label: str
    affiliation: str
    description: str | None = None
    view_box: str = "0 0 1200 720"

    model_config = {"from_attributes": True}


class BuildingRead(BaseModel):
    id: str
    name: str
    floors: list[FloorRead] = []

    model_config = {"from_attributes": True}


class CampusRead(BaseModel):
    id: str
    name: str
    address: str | None = None
    buildings: list[BuildingRead] = []

    model_config = {"from_attributes": True}
