from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import campuses, floors, reservations, users, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.DEV_MODE:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="HySpace API", version="0.1.0", lifespan=lifespan)

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(campuses.router)
app.include_router(floors.router)
app.include_router(reservations.router)
app.include_router(users.router)
app.include_router(admin.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
