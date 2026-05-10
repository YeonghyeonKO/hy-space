from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.campus import Campus
from app.schemas.campus import CampusRead

router = APIRouter(prefix="/api/v1", tags=["campuses"])


@router.get("/campuses", response_model=list[CampusRead])
async def list_campuses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campus))
    return result.scalars().all()


@router.get("/campuses/{campus_id}", response_model=CampusRead)
async def get_campus(campus_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campus).where(Campus.id == campus_id))
    campus = result.scalar_one_or_none()
    if not campus:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Campus not found")
    return campus
