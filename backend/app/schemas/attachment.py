from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AttachmentResponse(BaseModel):
    id: int
    filename: str
    original_name: str
    file_type: str
    file_size: int
    article_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
