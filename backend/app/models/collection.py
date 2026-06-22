from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Collection(Base):
    __tablename__ = "collections"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_user_collection_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="collections")
    movies = relationship(
        "CollectionMovie",
        back_populates="collection",
        cascade="all, delete-orphan",
        order_by="desc(CollectionMovie.created_at)",
    )


class CollectionMovie(Base):
    __tablename__ = "collection_movies"
    __table_args__ = (UniqueConstraint("collection_id", "imdb_id", name="uq_collection_movie"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    collection_id: Mapped[int] = mapped_column(Integer, ForeignKey("collections.id", ondelete="CASCADE"), nullable=False)
    imdb_id: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    year: Mapped[str] = mapped_column(String(10), nullable=False)
    poster_url: Mapped[str] = mapped_column(String(500), nullable=False)
    type: Mapped[str] = mapped_column(String(40), nullable=False, default="movie")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    collection = relationship("Collection", back_populates="movies")
