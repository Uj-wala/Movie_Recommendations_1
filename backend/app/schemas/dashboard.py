from pydantic import BaseModel


class DashboardStatsData(BaseModel):
    total_favorites: int
    total_searches: int
    recent_searches: list[str]
