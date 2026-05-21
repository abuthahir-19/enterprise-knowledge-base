from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: int
    content: str
    user_id: int
    article_id: int
    parent_id: Optional[int] = None
    created_at: datetime
    user: Optional[UserResponse] = None
    replies: Optional[List["CommentResponse"]] = []

    model_config = ConfigDict(from_attributes=True)


# Required for self-referential model
CommentResponse.model_rebuild()
