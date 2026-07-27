import uuid
from datetime import datetime, date

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class PrivateOpportunity(Base):
    __tablename__ = "private_opportunities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    provider: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    eligibility_criteria: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    award_range: Mapped[str | None] = mapped_column(String(100), nullable=True)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    field_tags: Mapped[list | None] = mapped_column(ARRAY(Text), nullable=True)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    guidelines: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_parsed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
