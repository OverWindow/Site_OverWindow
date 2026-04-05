from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from typing import List
from app.db import get_db
from app.models import LinkCategory, Link
from app.schemas.link import (
    LinkCategoryCreate,
    LinkCategoryUpdate,
    LinkCreate,
    LinkUpdate,
    LinkResponse,
    LinkCategoryResponse,
    LinkCategoryWithLinksResponse,
)
from app.dependencies import require_admin


router = APIRouter(prefix="/links", tags=["links"])


# -----------------------------
# Public APIs
# -----------------------------

@router.get("/public", response_model=List[LinkCategoryWithLinksResponse])
def get_public_categories_with_links(db: Session = Depends(get_db)):
    categories = (
        db.query(LinkCategory)
        .options(selectinload(LinkCategory.links))
        .filter(LinkCategory.is_visible.is_(True))
        .order_by(LinkCategory.sort_order.asc(), LinkCategory.id.asc())
        .all()
    )

    result = []
    for category in categories:
        visible_links = sorted(
            [link for link in category.links if link.is_visible],
            key=lambda x: (x.sort_order, x.id),
        )

        category.links = visible_links
        result.append(category)

    return result


@router.get("/public/{slug}", response_model=LinkCategoryWithLinksResponse)
def get_public_category_by_slug(slug: str, db: Session = Depends(get_db)):
    category = (
        db.query(LinkCategory)
        .options(selectinload(LinkCategory.links))
        .filter(
            LinkCategory.slug == slug,
            LinkCategory.is_visible.is_(True),
        )
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="카테고리를 찾을 수 없습니다.",
        )

    category.links = sorted(
        [link for link in category.links if link.is_visible],
        key=lambda x: (x.sort_order, x.id),
    )
    return category


# -----------------------------
# Admin Category APIs
# -----------------------------

@router.get("/admin/categories", response_model=List[LinkCategoryWithLinksResponse])
def admin_get_categories(
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    categories = (
        db.query(LinkCategory)
        .options(selectinload(LinkCategory.links))
        .order_by(LinkCategory.sort_order.asc(), LinkCategory.id.asc())
        .all()
    )

    for category in categories:
        category.links = sorted(category.links, key=lambda x: (x.sort_order, x.id))

    return categories


@router.post(
    "/admin/categories",
    response_model=LinkCategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    payload: LinkCategoryCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    existing_slug = db.query(LinkCategory).filter(LinkCategory.slug == payload.slug).first()
    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 slug입니다.",
        )

    category = LinkCategory(
        name=payload.name,
        slug=payload.slug,
        sort_order=payload.sort_order,
        is_visible=payload.is_visible,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/admin/categories/{category_id}", response_model=LinkCategoryResponse)
def update_category(
    category_id: int,
    payload: LinkCategoryUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    category = db.query(LinkCategory).filter(LinkCategory.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="카테고리를 찾을 수 없습니다.",
        )

    data = payload.model_dump(exclude_unset=True)

    if "slug" in data and data["slug"] != category.slug:
        exists = db.query(LinkCategory).filter(LinkCategory.slug == data["slug"]).first()
        if exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 slug입니다.",
            )

    for key, value in data.items():
        setattr(category, key, value)

    db.commit()
    db.refresh(category)
    return category


@router.delete("/admin/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    category = db.query(LinkCategory).filter(LinkCategory.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="카테고리를 찾을 수 없습니다.",
        )

    db.delete(category)
    db.commit()
    return None


# -----------------------------
# Admin Link APIs
# -----------------------------

@router.post(
    "/admin/items",
    response_model=LinkResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_link(
    payload: LinkCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    category = db.query(LinkCategory).filter(LinkCategory.id == payload.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="카테고리를 찾을 수 없습니다.",
        )

    link = Link(
        category_id=payload.category_id,
        title=payload.title,
        url=str(payload.url),
        description=payload.description,
        icon_name=payload.icon_name,
        sort_order=payload.sort_order,
        is_visible=payload.is_visible,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.patch("/admin/items/{link_id}", response_model=LinkResponse)
def update_link(
    link_id: int,
    payload: LinkUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    link = db.query(Link).filter(Link.id == link_id).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="링크를 찾을 수 없습니다.",
        )

    data = payload.model_dump(exclude_unset=True)

    if "category_id" in data:
        category = db.query(LinkCategory).filter(LinkCategory.id == data["category_id"]).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="새 카테고리를 찾을 수 없습니다.",
            )

    if "url" in data and data["url"] is not None:
        data["url"] = str(data["url"])

    for key, value in data.items():
        setattr(link, key, value)

    db.commit()
    db.refresh(link)
    return link


@router.delete("/admin/items/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_link(
    link_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    link = db.query(Link).filter(Link.id == link_id).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="링크를 찾을 수 없습니다.",
        )

    db.delete(link)
    db.commit()
    return None