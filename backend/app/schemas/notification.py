from datetime import datetime

from pydantic import BaseModel, Field


class NotificationResponse(BaseModel):
    id: int
    type: str
    message: str
    actor_user_id: int | None = None
    actor_email: str | None = None
    review_id: int | None = None
    imdb_id: str | None = None
    is_read: bool = False
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse] = Field(default_factory=list)
    unread_count: int = 0
    total: int = 0


class MarkNotificationsReadRequest(BaseModel):
    notification_ids: list[int] | None = None
