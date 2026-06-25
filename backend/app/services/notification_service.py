from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User


class NotificationService:
    @staticmethod
    def create(
        db: Session,
        recipient_user_id: int,
        notification_type: str,
        message: str,
        actor_user_id: int | None = None,
        review_id: int | None = None,
        imdb_id: str | None = None,
    ) -> Notification | None:
        if actor_user_id is not None and actor_user_id == recipient_user_id:
            return None

        notification = Notification(
            recipient_user_id=recipient_user_id,
            actor_user_id=actor_user_id,
            type=notification_type,
            message=message,
            review_id=review_id,
            imdb_id=imdb_id,
        )
        db.add(notification)
        return notification

    @staticmethod
    def create_review_like(db: Session, review, actor: User) -> Notification | None:
        return NotificationService.create(
            db=db,
            recipient_user_id=review.user_id,
            actor_user_id=actor.id,
            notification_type="review_liked",
            message=f"{actor.email} liked your review.",
            review_id=review.id,
            imdb_id=review.imdb_id,
        )

    @staticmethod
    def create_collection_follow(db: Session, collection, actor: User) -> Notification | None:
        return NotificationService.create(
            db=db,
            recipient_user_id=collection.user_id,
            actor_user_id=actor.id,
            notification_type="collection_followed",
            message=f"{actor.email} followed your collection \"{collection.name}\".",
        )

    @staticmethod
    def create_recommendation_generated(db: Session, user: User, count: int) -> Notification | None:
        existing_unread = (
            db.query(Notification)
            .filter(
                Notification.recipient_user_id == user.id,
                Notification.type == "recommendation_generated",
                Notification.is_read.is_(False),
            )
            .first()
        )
        if existing_unread:
            return None

        label = "recommendation" if count == 1 else "recommendations"
        return NotificationService.create(
            db=db,
            recipient_user_id=user.id,
            notification_type="recommendation_generated",
            message=f"{count} new movie {label} generated for you.",
        )

    @staticmethod
    def unread_count(db: Session, user_id: int) -> int:
        return (
            db.query(func.count(Notification.id))
            .filter(Notification.recipient_user_id == user_id, Notification.is_read.is_(False))
            .scalar()
            or 0
        )
