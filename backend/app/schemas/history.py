from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, StrictStr, field_validator


class SearchKeywordQuery(BaseModel):
    title: StrictStr = Field(...)
    page: int = Field(1, ge=1)

    @property
    def keyword(self) -> str:
        return self.title

    @property
    def normalized_keyword(self) -> str:
        return self.title.strip()

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Keyword is required")
        if len(normalized) > 255:
            raise ValueError("Keyword must be 255 characters or fewer")
        return value


class SearchHistoryQuery(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(10, ge=1, le=100)


class SearchHistoryItem(BaseModel):
    keyword: str
    searched_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SearchHistoryResponse(BaseModel):
    success: bool = True
    data: list[SearchHistoryItem]
    page: int
    limit: int
    total: int
    total_pages: int

    model_config = ConfigDict(from_attributes=True)
