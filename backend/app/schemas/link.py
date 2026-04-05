from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, HttpUrl


class LinkCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=120)
    sort_order: int = 0
    is_visible: bool = True


class LinkCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=120)
    sort_order: Optional[int] = None
    is_visible: Optional[bool] = None


class LinkCreate(BaseModel):
    category_id: int
    title: str = Field(..., min_length=1, max_length=200)
    url: HttpUrl
    description: Optional[str] = None
    icon_name: Optional[str] = Field(None, max_length=100)
    sort_order: int = 0
    is_visible: bool = True


class LinkUpdate(BaseModel):
    category_id: Optional[int] = None
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    url: Optional[HttpUrl] = None
    description: Optional[str] = None
    icon_name: Optional[str] = Field(None, max_length=100)
    sort_order: Optional[int] = None
    is_visible: Optional[bool] = None


class LinkResponse(BaseModel):
    id: int
    category_id: int
    title: str
    url: str
    description: Optional[str] = None
    icon_name: Optional[str] = None
    sort_order: int
    is_visible: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LinkCategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    sort_order: int
    is_visible: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LinkCategoryWithLinksResponse(BaseModel):
    id: int
    name: str
    slug: str
    sort_order: int
    is_visible: bool
    links: List[LinkResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True