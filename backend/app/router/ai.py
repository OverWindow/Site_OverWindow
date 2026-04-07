from fastapi import APIRouter, Depends

from app.schemas.ai import (
    DevelopmentRecommendationRequest,
    DevelopmentRecommendationResponse,
)
from app.utils.ai_recommendation import get_development_recommendations
from app.dependencies import require_admin


router = APIRouter(prefix="/ai", tags=["ai"])


@router.post(
    "/development-recommendations",
    response_model=DevelopmentRecommendationResponse,
    
)
def create_development_recommendations(
    payload: DevelopmentRecommendationRequest,
     _: object = Depends(require_admin),
):
    return get_development_recommendations(payload)

