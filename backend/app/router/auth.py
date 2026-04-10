from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, RefreshToken
from app.schemas.login import (
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    MessageResponse,
    MeResponse,
    MeUpdateRequest,
)
from app.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_refresh_token,
    get_refresh_token_expiry,
    hash_password,
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 계정입니다.",
        )

    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자만 로그인할 수 있습니다.",
        )

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token()

    db_token = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=get_refresh_token_expiry(),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )

    user.last_login_at = datetime.now(timezone.utc).replace(tzinfo=None)

    db.add(db_token)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_access_token(
    payload: RefreshRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    hashed = hash_refresh_token(payload.refresh_token)

    token_row = db.query(RefreshToken).filter(RefreshToken.token_hash == hashed).first()

    if not token_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 refresh token입니다.",
        )

    if token_row.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이미 폐기된 refresh token입니다.",
        )

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if token_row.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="만료된 refresh token입니다.",
        )

    user = db.query(User).filter(User.id == token_row.user_id).first()
    if not user or not user.is_active or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 사용자입니다.",
        )

    token_row.revoked_at = now

    new_refresh_token = create_refresh_token()
    new_db_token = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(new_refresh_token),
        expires_at=get_refresh_token_expiry(),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )

    db.add(new_db_token)
    db.commit()

    new_access_token = create_access_token(str(user.id))

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    payload: RefreshRequest,
    db: Session = Depends(get_db),
):
    hashed = hash_refresh_token(payload.refresh_token)
    token_row = db.query(RefreshToken).filter(RefreshToken.token_hash == hashed).first()

    if token_row and token_row.revoked_at is None:
        token_row.revoked_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.commit()

    return MessageResponse(message="로그아웃되었습니다.")


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자만 접근할 수 있습니다.",
        )
    return current_user


@router.patch("/me", response_model=MeResponse)
def update_me(
    payload: MeUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.username is not None and payload.username != current_user.username:
        existing_username = (
            db.query(User)
            .filter(User.username == payload.username, User.id != current_user.id)
            .first()
        )
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 username 입니다.",
            )
        current_user.username = payload.username

    if payload.email is not None and str(payload.email) != current_user.email:
        existing_email = (
            db.query(User)
            .filter(User.email == str(payload.email), User.id != current_user.id)
            .first()
        )
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 email 입니다.",
            )
        current_user.email = str(payload.email)

    if payload.password is not None:
        try:
            current_user.password_hash = hash_password(payload.password)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )

    db.commit()
    db.refresh(current_user)
    return current_user
