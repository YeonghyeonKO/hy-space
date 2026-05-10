from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, Affiliation
from app.schemas.user import UserRead, AffiliationRead

router = APIRouter(prefix="/api/v1", tags=["users"])


@router.get("/users/me", response_model=UserRead)
async def get_me(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).limit(1))
    user = result.scalar_one_or_none()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No user found. Run POST /api/v1/seed first.")
    return user


@router.get("/affiliations", response_model=list[AffiliationRead])
async def list_affiliations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Affiliation))
    return result.scalars().all()
