from datetime import date, datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field, HttpUrl, field_validator


class ProjectImageBase(BaseModel):
    image_url: HttpUrl
    alt_text: Optional[str] = Field(None, max_length=300)
    caption: Optional[str] = Field(None, max_length=500)
    image_type: str = Field("screenshot", max_length=50)
    is_thumbnail: bool = False
    sort_order: int = 0


class ProjectImageCreate(ProjectImageBase):
    pass


class ProjectImageUpdate(BaseModel):
    alt_text: Optional[str] = Field(None, max_length=300)
    caption: Optional[str] = Field(None, max_length=500)
    image_type: Optional[str] = Field(None, max_length=50)
    is_thumbnail: Optional[bool] = None
    sort_order: Optional[int] = None


class ProjectImageResponse(ProjectImageBase):
    id: int
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    project_key: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=200)
    subtitle: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    content_json: Optional[Any] = None
    github_url: Optional[HttpUrl] = None
    demo_url: Optional[HttpUrl] = None
    tech_stack: Optional[Any] = None
    started_at: Optional[date] = None
    ended_at: Optional[date] = None
    is_featured: bool = False
    is_visible: bool = True
    sort_order: int = 0

    @field_validator("subtitle", "description", mode="before")
    @classmethod
    def empty_string_to_none(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class ProjectCreate(ProjectBase):
    images: List[ProjectImageCreate] = Field(default_factory=list)


class ProjectUpdate(BaseModel):
    project_key: Optional[str] = Field(None, min_length=1, max_length=100)
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    subtitle: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    content_json: Optional[Any] = None
    github_url: Optional[HttpUrl] = None
    demo_url: Optional[HttpUrl] = None
    tech_stack: Optional[Any] = None
    started_at: Optional[date] = None
    ended_at: Optional[date] = None
    is_featured: Optional[bool] = None
    is_visible: Optional[bool] = None
    sort_order: Optional[int] = None
    images: Optional[List[ProjectImageCreate]] = None

    @field_validator("project_key", "title", "subtitle", "description", mode="before")
    @classmethod
    def empty_string_to_none(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    images: List[ProjectImageResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ProjectImageUploadResponse(ProjectImageResponse):
    pass
