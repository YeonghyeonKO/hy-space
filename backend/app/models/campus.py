import uuid
from datetime import datetime

from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Campus(Base):
    __tablename__ = "campuses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    buildings: Mapped[list["Building"]] = relationship(back_populates="campus", lazy="selectin")


class Building(Base):
    __tablename__ = "buildings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campus_id: Mapped[str] = mapped_column(ForeignKey("campuses.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    campus: Mapped["Campus"] = relationship(back_populates="buildings")
    floors: Mapped[list["Floor"]] = relationship(back_populates="building", lazy="selectin")


class Floor(Base):
    __tablename__ = "floors"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    building_id: Mapped[str] = mapped_column(ForeignKey("buildings.id"), nullable=False)
    label: Mapped[str] = mapped_column(String(10), nullable=False)
    affiliation: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(String(100), nullable=True)
    view_box: Mapped[str] = mapped_column(String(50), default="0 0 1200 720")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    building: Mapped["Building"] = relationship(back_populates="floors")
    seats: Mapped[list["Seat"]] = relationship(back_populates="floor", lazy="selectin")
    rooms: Mapped[list["Room"]] = relationship(back_populates="floor", lazy="selectin")
    zones: Mapped[list["Zone"]] = relationship(back_populates="floor", lazy="selectin")
