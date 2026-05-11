from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User, Affiliation
from app.schemas.user import UserRead, AffiliationRead

router = APIRouter(prefix="/api/v1", tags=["users"])


@router.get("/users/me", response_model=UserRead)
async def get_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Resolve bookable_floors from user's affiliation
    result = await db.execute(
        select(Affiliation).where(Affiliation.name == user.affiliation)
    )
    aff = result.scalar_one_or_none()
    bookable = aff.bookable_floors if aff else []

    return UserRead(
        id=user.id,
        name=user.name,
        email=user.email,
        affiliation=user.affiliation,
        team=user.team,
        bookable_floors=bookable,
    )


@router.get("/affiliations", response_model=list[AffiliationRead])
async def list_affiliations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Affiliation))
    return result.scalars().all()
