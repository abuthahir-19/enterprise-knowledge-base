from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator


class RatingCreate(BaseModel):
    value: int

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("Rating value must be between 1 and 5")
        return v


class RatingResponse(BaseModel):
    id: int
    value: int
    user_id: int
    article_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
