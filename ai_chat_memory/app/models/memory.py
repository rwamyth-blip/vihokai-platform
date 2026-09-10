import uuid
from datetime import datetime
from pgvector.sqlalchemy import Vector
from sqlalchemy import String, Text, SmallInteger, Float, Integer, ForeignKey, DateTime, Index, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.core.config import settings
from app.models.base import Base, UUIDMixin, TimestampMixin


class Memory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "memories"
    __table_args__ = (
        CheckConstraint("category IN ('preference','goal','fact','instruction')",
                        name="ck_mem_category"),
        CheckConstraint("importance BETWEEN 1 AND 5", name="ck_mem_importance"),
        Index("idx_mem_user", "user_id", "status"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    content: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(30))
    importance: Mapped[int] = mapped_column(SmallInteger, default=3)
    confidence: Mapped[float] = mapped_column(Float, default=0.8)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(settings.EMBEDDING_DIM))
    source_message_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("messages.id", ondelete="SET NULL")
    )
    status: Mapped[str] = mapped_column(String(20), default="active")
    access_count: Mapped[int] = mapped_column(Integer, default=0)
    last_accessed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))