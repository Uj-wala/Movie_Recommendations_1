from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recipient_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    review_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=True, index=True)
    imdb_id: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="0", index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    recipient = relationship("User", back_populates="notifications", foreign_keys=[recipient_user_id])
    actor = relationship("User", back_populates="sent_notifications", foreign_keys=[actor_user_id])
    review = relationship("Review", back_populates="notifications")
