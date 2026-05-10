from pydantic import BaseModel


class UserRead(BaseModel):
    id: str
    name: str
    email: str
    affiliation: str
    team: str | None = None

    model_config = {"from_attributes": True}


class AffiliationRead(BaseModel):
    id: str
    name: str
    color: str
    bookable_floors: list[str] = []

    model_config = {"from_attributes": True}
