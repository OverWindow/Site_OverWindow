from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, HttpUrl, field_validator


class RecommendedItemBase(BaseModel):
    type: Literal["website", "app"]
    title: str = Field(..., min_length=1, max_length=255)
    url: HttpUrl
    description: Optional[str] = None
    sort_order: int = 0


class RecommendedItemCreate(RecommendedItemBase):
    pass


class RecommendedItemUpdate(RecommendedItemBase):
    pass


class RecommendedItemResponse(RecommendedItemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class RecommendationCreate(BaseModel):
    topic: str = Field(..., min_length=1, max_length=255)
    features: str = Field(..., min_length=1)
    additional_context: Optional[str] = None
    analysis: Optional[str] = None
    items: List[RecommendedItemCreate] = Field(default_factory=list)

    @field_validator("additional_context", "analysis", mode="before")
    @classmethod
    def empty_string_to_none(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class RecommendationUpdate(BaseModel):
    topic: Optional[str] = Field(None, min_length=1, max_length=255)
    features: Optional[str] = Field(None, min_length=1)
    additional_context: Optional[str] = None
    analysis: Optional[str] = None
    items: Optional[List[RecommendedItemUpdate]] = None

    @field_validator("topic", "features", "additional_context", "analysis", mode="before")
    @classmethod
    def empty_string_to_none(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class RecommendationResponse(BaseModel):
    id: int
    user_id: int
    topic: str
    features: str
    additional_context: Optional[str] = None
    analysis: Optional[str] = None
    created_at: datetime
    items: List[RecommendedItemResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
