from datetime import datetime
from pydantic import BaseModel


class SearchHistoryItem(BaseModel):
    keyword: str
    created_at: datetime

    class Config:
        orm_mode = True
