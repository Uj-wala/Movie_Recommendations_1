from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import MarkNotificationsReadRequest, NotificationListResponse, NotificationResponse
from app.services.auth_service import get_current_user
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _build_notification_response(notification: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=notification.id,
        type=notification.type,
        message=notification.message,
        actor_user_id=notification.actor_user_id,
        actor_email=notification.actor.email if notification.actor else None,
        review_id=notification.review_id,
        imdb_id=notification.imdb_id,
        is_read=notification.is_read,
        created_at=notification.created_at,
    )


def _list_notifications_for_user(db: Session, current_user: User, limit: int = 20) -> NotificationListResponse:
    notifications = (
        db.query(Notification)
        .filter(Notification.recipient_user_id == current_user.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(limit)
        .all()
    )
    total = (
        db.query(func.count(Notification.id))
        .filter(Notification.recipient_user_id == current_user.id)
        .scalar()
        or 0
    )
    return NotificationListResponse(
        items=[_build_notification_response(notification) for notification in notifications],
        unread_count=NotificationService.unread_count(db, current_user.id),
        total=total,
    )


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
):
    return _list_notifications_for_user(db=db, current_user=current_user, limit=limit)


@router.patch("/read", response_model=NotificationListResponse)
def mark_notifications_read(
    payload: MarkNotificationsReadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification).filter(Notification.recipient_user_id == current_user.id)
    if payload.notification_ids:
        query = query.filter(Notification.id.in_(payload.notification_ids))
    query.update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return _list_notifications_for_user(db=db, current_user=current_user)
