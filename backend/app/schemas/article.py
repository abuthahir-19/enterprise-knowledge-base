from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse
from app.schemas.category import CategoryResponse
from app.schemas.tag import TagResponse


class ArticleBase(BaseModel):
    title: str
    description: Optional[str] = None
    content: str
    category_id: Optional[int] = None
    tag_ids: List[int] = []


class ArticleCreate(ArticleBase):
    pass


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None


class ArticleResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    content: str
    status: str
    author_id: Optional[int] = None
    category_id: Optional[int] = None
    view_count: int
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    author: Optional[UserResponse] = None
    category: Optional[CategoryResponse] = None
    tags: List[TagResponse] = []
    average_rating: Optional[float] = None
    comment_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ArticleSummary(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str
    author_id: Optional[int] = None
    category_id: Optional[int] = None
    view_count: int
    created_at: datetime
    author: Optional[UserResponse] = None
    category: Optional[CategoryResponse] = None
    tags: List[TagResponse] = []
    average_rating: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
