from typing import Optional
from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    total_articles: int
    published_articles: int
    pending_approvals: int
    total_users: int
    total_categories: int
    total_views: int


class PopularArticle(BaseModel):
    id: int
    title: str
    view_count: int
    average_rating: Optional[float] = None


class UserActivity(BaseModel):
    user_id: int
    name: str
    article_count: int
    last_active: Optional[str] = None
