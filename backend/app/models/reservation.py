import uuid
from datetime import datetime, date

from sqlalchemy import String, Integer, Date, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    kind: Mapped[str] = mapped_column(String(10), nullable=False)  # seat or room
    target_id: Mapped[str] = mapped_column(String, nullable=False)
    floor_id: Mapped[str] = mapped_column(ForeignKey("floors.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[str] = mapped_column(String(5), nullable=False)
    end_time: Mapped[str] = mapped_column(String(5), nullable=False)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    attendees: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="confirmed")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
