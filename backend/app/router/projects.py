from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.dependencies import require_admin
from app.models import CVProject, CVProjectImage
from app.schemas.login import MessageResponse
from app.schemas.project import (
    ProjectCreate,
    ProjectImageResponse,
    ProjectImageUpdate,
    ProjectImageUploadResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.utils.supabase_storage import (
    delete_project_image_object,
    readable_url_for_image,
    upload_project_image,
)


router = APIRouter(prefix="/projects", tags=["projects"])


def _project_response(project: CVProject) -> ProjectResponse:
    return ProjectResponse.model_validate(
        {
            "id": project.id,
            "project_key": project.project_key,
            "title": project.title,
            "subtitle": project.subtitle,
            "description": project.description,
            "content_json": project.content_json,
            "github_url": project.github_url,
            "demo_url": project.demo_url,
            "tech_stack": project.tech_stack,
            "started_at": project.started_at,
            "ended_at": project.ended_at,
            "is_featured": project.is_featured,
            "is_visible": project.is_visible,
            "sort_order": project.sort_order,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "images": [
                {
                    "id": image.id,
                    "project_id": image.project_id,
                    "image_url": readable_url_for_image(image.image_url),
                    "alt_text": image.alt_text,
                    "caption": image.caption,
                    "image_type": image.image_type,
                    "is_thumbnail": image.is_thumbnail,
                    "sort_order": image.sort_order,
                    "created_at": image.created_at,
                }
                for image in project.images
            ],
        }
    )


def _get_project_or_404(project_id: int, db: Session) -> CVProject:
    project = (
        db.query(CVProject)
        .options(selectinload(CVProject.images))
        .filter(CVProject.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="프로젝트를 찾을 수 없습니다.",
        )
    return project


def _get_public_project_or_404(project_key: str, db: Session) -> CVProject:
    project = (
        db.query(CVProject)
        .options(selectinload(CVProject.images))
        .filter(CVProject.project_key == project_key, CVProject.is_visible.is_(True))
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="프로젝트를 찾을 수 없습니다.",
        )
    return project


def _ensure_unique_project_key(
    db: Session,
    project_key: str,
    current_project_id: Optional[int] = None,
) -> None:
    query = db.query(CVProject).filter(CVProject.project_key == project_key)
    if current_project_id is not None:
        query = query.filter(CVProject.id != current_project_id)
    if query.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 project_key입니다.",
        )


def _replace_images(project: CVProject, images) -> None:
    project.images.clear()
    for image in images:
        project.images.append(
            CVProjectImage(
                image_url=str(image.image_url),
                alt_text=image.alt_text,
                caption=image.caption,
                image_type=image.image_type,
                is_thumbnail=image.is_thumbnail,
                sort_order=image.sort_order,
            )
        )


@router.get("/public", response_model=List[ProjectResponse])
def list_public_projects(db: Session = Depends(get_db)):
    projects = (
        db.query(CVProject)
        .options(selectinload(CVProject.images))
        .filter(CVProject.is_visible.is_(True))
        .order_by(CVProject.sort_order.asc(), CVProject.id.desc())
        .all()
    )
    return [_project_response(project) for project in projects]


@router.get("/public/{project_key}", response_model=ProjectResponse)
def get_public_project(project_key: str, db: Session = Depends(get_db)):
    return _project_response(_get_public_project_or_404(project_key, db))


@router.get("/admin", response_model=List[ProjectResponse])
def admin_list_projects(
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    projects = (
        db.query(CVProject)
        .options(selectinload(CVProject.images))
        .order_by(CVProject.sort_order.asc(), CVProject.id.desc())
        .all()
    )
    return [_project_response(project) for project in projects]


@router.get("/admin/{project_id}", response_model=ProjectResponse)
def admin_get_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    return _project_response(_get_project_or_404(project_id, db))


@router.post("/admin", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    _ensure_unique_project_key(db, payload.project_key)

    project = CVProject(
        project_key=payload.project_key,
        title=payload.title,
        subtitle=payload.subtitle,
        description=payload.description,
        content_json=payload.content_json,
        github_url=str(payload.github_url) if payload.github_url else None,
        demo_url=str(payload.demo_url) if payload.demo_url else None,
        tech_stack=payload.tech_stack,
        started_at=payload.started_at,
        ended_at=payload.ended_at,
        is_featured=payload.is_featured,
        is_visible=payload.is_visible,
        sort_order=payload.sort_order,
    )
    _replace_images(project, payload.images)

    db.add(project)
    db.commit()
    db.refresh(project)
    return _project_response(_get_project_or_404(project.id, db))


@router.patch("/admin/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    project = _get_project_or_404(project_id, db)
    data = payload.model_dump(exclude_unset=True)

    if "project_key" in data and data["project_key"] != project.project_key:
        _ensure_unique_project_key(db, data["project_key"], current_project_id=project.id)

    images = data.pop("images", None)
    for key, value in data.items():
        if key in {"github_url", "demo_url"} and value is not None:
            value = str(value)
        setattr(project, key, value)

    if images is not None:
        _replace_images(project, payload.images or [])

    db.commit()
    return _project_response(_get_project_or_404(project.id, db))


@router.delete("/admin/{project_id}", response_model=MessageResponse)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    project = _get_project_or_404(project_id, db)
    for image in project.images:
        delete_project_image_object(image.image_url)
    db.delete(project)
    db.commit()
    return MessageResponse(message="프로젝트가 삭제되었습니다.")


@router.post(
    "/admin/{project_id}/images",
    response_model=ProjectImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_image(
    project_id: int,
    file: UploadFile = File(...),
    alt_text: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    image_type: str = Form("screenshot"),
    is_thumbnail: bool = Form(False),
    sort_order: int = Form(0),
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    _get_project_or_404(project_id, db)
    image_url = upload_project_image(project_id, file)

    if is_thumbnail:
        (
            db.query(CVProjectImage)
            .filter(CVProjectImage.project_id == project_id)
            .update({CVProjectImage.is_thumbnail: False})
        )

    image = CVProjectImage(
        project_id=project_id,
        image_url=image_url,
        alt_text=alt_text,
        caption=caption,
        image_type=image_type,
        is_thumbnail=is_thumbnail,
        sort_order=sort_order,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.patch("/admin/images/{image_id}", response_model=ProjectImageResponse)
def update_image(
    image_id: int,
    payload: ProjectImageUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    image = db.query(CVProjectImage).filter(CVProjectImage.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="프로젝트 이미지를 찾을 수 없습니다.",
        )

    data = payload.model_dump(exclude_unset=True)
    if data.get("is_thumbnail") is True:
        (
            db.query(CVProjectImage)
            .filter(
                CVProjectImage.project_id == image.project_id,
                CVProjectImage.id != image.id,
            )
            .update({CVProjectImage.is_thumbnail: False})
        )

    for key, value in data.items():
        setattr(image, key, value)

    db.commit()
    db.refresh(image)
    return image


@router.delete("/admin/images/{image_id}", response_model=MessageResponse)
def delete_image(
    image_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    image = db.query(CVProjectImage).filter(CVProjectImage.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="프로젝트 이미지를 찾을 수 없습니다.",
        )

    delete_project_image_object(image.image_url)
    db.delete(image)
    db.commit()
    return MessageResponse(message="프로젝트 이미지가 삭제되었습니다.")
