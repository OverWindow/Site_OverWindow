from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.dependencies import get_current_user
from app.models import Recommendation, RecommendedItem, User
from app.schemas.login import MessageResponse
from app.schemas.recommendation import (
    RecommendationCreate,
    RecommendationResponse,
    RecommendationUpdate,
)


router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def _get_recommendation_or_404(
    recommendation_id: int,
    user_id: int,
    db: Session,
) -> Recommendation:
    recommendation = (
        db.query(Recommendation)
        .options(selectinload(Recommendation.items))
        .filter(Recommendation.id == recommendation_id, Recommendation.user_id == user_id)
        .first()
    )
    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found.",
        )
    recommendation.items = sorted(
        recommendation.items,
        key=lambda item: (item.sort_order, item.id),
    )
    return recommendation


@router.post("", response_model=RecommendationResponse, status_code=status.HTTP_201_CREATED)
def create_recommendation(
    payload: RecommendationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recommendation = Recommendation(
        user_id=current_user.id,
        topic=payload.topic,
        features=payload.features,
        additional_context=payload.additional_context,
        analysis=payload.analysis,
    )

    for item in payload.items:
        recommendation.items.append(
            RecommendedItem(
                type=item.type,
                title=item.title,
                url=str(item.url),
                description=item.description,
                sort_order=item.sort_order,
            )
        )

    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)
    return _get_recommendation_or_404(recommendation.id, current_user.id, db)


@router.get("", response_model=List[RecommendationResponse])
def list_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recommendations = (
        db.query(Recommendation)
        .options(selectinload(Recommendation.items))
        .filter(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.id.desc())
        .all()
    )

    for recommendation in recommendations:
        recommendation.items = sorted(
            recommendation.items,
            key=lambda item: (item.sort_order, item.id),
        )

    return recommendations


@router.get("/{recommendation_id}", response_model=RecommendationResponse)
def get_recommendation_detail(
    recommendation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_recommendation_or_404(recommendation_id, current_user.id, db)


@router.patch("/{recommendation_id}", response_model=RecommendationResponse)
def update_recommendation(
    recommendation_id: int,
    payload: RecommendationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recommendation = _get_recommendation_or_404(recommendation_id, current_user.id, db)

    if payload.topic is not None:
        recommendation.topic = payload.topic
    if payload.features is not None:
        recommendation.features = payload.features
    if payload.additional_context is not None:
        recommendation.additional_context = payload.additional_context
    if payload.analysis is not None:
        recommendation.analysis = payload.analysis

    if payload.items is not None:
        recommendation.items.clear()
        for item in payload.items:
            recommendation.items.append(
                RecommendedItem(
                    type=item.type,
                    title=item.title,
                    url=str(item.url),
                    description=item.description,
                    sort_order=item.sort_order,
                )
            )

    db.commit()
    return _get_recommendation_or_404(recommendation.id, current_user.id, db)


@router.delete("/{recommendation_id}", response_model=MessageResponse)
def delete_recommendation(
    recommendation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recommendation = _get_recommendation_or_404(recommendation_id, current_user.id, db)
    db.delete(recommendation)
    db.commit()
    return MessageResponse(message="Recommendation deleted.")
