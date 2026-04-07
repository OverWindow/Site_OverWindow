from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class DevelopmentRecommendationRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    features: str = Field(..., min_length=1, max_length=2000)
    additional_context: Optional[str] = Field(None, max_length=2000)


class RecommendationItem(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    url: HttpUrl
    description: str = Field(..., min_length=1, max_length=500)


class DevelopmentRecommendationResponse(BaseModel):
    websites: List[RecommendationItem] = Field(default_factory=list)
    apps: List[RecommendationItem] = Field(default_factory=list)
    analysis: str = Field(..., min_length=1, max_length=1000)

