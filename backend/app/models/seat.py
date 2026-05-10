import uuid
from datetime import datetime

from sqlalchemy import String, Float, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Seat(Base):
    __tablename__ = "seats"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    floor_id: Mapped[str] = mapped_column(ForeignKey("floors.id"), nullable=False)
    label: Mapped[str] = mapped_column(String(20), nullable=False)
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    w: Mapped[float] = mapped_column(Float, default=36.0)
    h: Mapped[float] = mapped_column(Float, default=32.0)
    facing: Mapped[str] = mapped_column(String(10), default="up")
    group_name: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    floor: Mapped["Floor"] = relationship(back_populates="seats")
