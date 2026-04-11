from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.schemas.ai import (
    DevelopmentRecommendationRequest,
    DevelopmentRecommendationResponse,
)
from app.utils.ai_recommendation import (
    get_development_recommendations,
    save_development_recommendations,
)
from app.dependencies import require_admin


router = APIRouter(prefix="/ai", tags=["ai"])


@router.post(
    "/development-recommendations",
    response_model=DevelopmentRecommendationResponse,
    
)
def create_development_recommendations(
    payload: DevelopmentRecommendationRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    result = get_development_recommendations(payload)
    save_development_recommendations(payload, result, current_user, db)
    return result
