import os
import posixpath
import uuid
from typing import Optional
from urllib.parse import quote, urlparse

import requests
from fastapi import HTTPException, UploadFile, status


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "project-images")
SUPABASE_STORAGE_PUBLIC_BASE_URL = os.getenv("SUPABASE_STORAGE_PUBLIC_BASE_URL")
SUPABASE_STORAGE_SIGNED_URL_EXPIRES = int(
    os.getenv("SUPABASE_STORAGE_SIGNED_URL_EXPIRES", "3600")
)
REQUEST_TIMEOUT = 30


def _require_supabase_settings() -> None:
    missing = []
    if not SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not SUPABASE_SERVICE_ROLE_KEY:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if not SUPABASE_STORAGE_BUCKET:
        missing.append("SUPABASE_STORAGE_BUCKET")

    if missing:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Supabase Storage 환경변수가 설정되지 않았습니다: {', '.join(missing)}",
        )

    if not _is_jwt_key(SUPABASE_SERVICE_ROLE_KEY):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "SUPABASE_SERVICE_ROLE_KEY에는 Legacy service_role JWT 키를 넣어야 합니다. "
                "sb_secret_... 형식의 Secret key는 Storage REST Authorization Bearer 토큰으로 "
                "사용할 수 없어 Invalid Compact JWS 오류가 발생합니다."
            ),
        )


def _is_jwt_key(value: Optional[str]) -> bool:
    if not value:
        return False
    return value.count(".") == 2 and value.startswith("eyJ")


def _headers(content_type: Optional[str] = None) -> dict:
    _require_supabase_settings()
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }
    if content_type:
        headers["Content-Type"] = content_type
    return headers


def _storage_object_url(key: str) -> str:
    return _storage_object_url_for_bucket(SUPABASE_STORAGE_BUCKET, key)


def _storage_object_url_for_bucket(bucket: str, key: str) -> str:
    encoded_key = "/".join(quote(part) for part in key.split("/"))
    return (
        f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/"
        f"{quote(bucket)}/{encoded_key}"
    )


def _storage_sign_url(key: str) -> str:
    return _storage_sign_url_for_bucket(SUPABASE_STORAGE_BUCKET, key)


def _storage_sign_url_for_bucket(bucket: str, key: str) -> str:
    encoded_key = "/".join(quote(part) for part in key.split("/"))
    return (
        f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/sign/"
        f"{quote(bucket)}/{encoded_key}"
    )


def public_url_for_key(key: str) -> str:
    _require_supabase_settings()
    encoded_key = "/".join(quote(part) for part in key.split("/"))
    if SUPABASE_STORAGE_PUBLIC_BASE_URL:
        return f"{SUPABASE_STORAGE_PUBLIC_BASE_URL.rstrip('/')}/{encoded_key}"
    return (
        f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/public/"
        f"{quote(SUPABASE_STORAGE_BUCKET)}/{encoded_key}"
    )


def key_from_public_url(url: str) -> Optional[str]:
    parsed = parse_storage_public_url(url)
    if parsed:
        return parsed["key"]

    if SUPABASE_STORAGE_PUBLIC_BASE_URL and url.startswith(
        SUPABASE_STORAGE_PUBLIC_BASE_URL.rstrip("/")
    ):
        base_path = urlparse(SUPABASE_STORAGE_PUBLIC_BASE_URL).path.strip("/")
        if base_path and parsed_path.startswith(base_path):
            return parsed_path[len(base_path) :].strip("/")
        return parsed_path

    return None


def parse_storage_public_url(url: str) -> Optional[dict]:
    parsed_path = urlparse(url).path.strip("/")
    marker = "storage/v1/object/public/"
    if marker not in parsed_path:
        return None

    remainder = parsed_path.split(marker, 1)[1]
    if "/" not in remainder:
        return None

    bucket, key = remainder.split("/", 1)
    return {"bucket": bucket, "key": key}


def create_signed_url(key: str, expires_in: Optional[int] = None) -> Optional[str]:
    return create_signed_url_for_bucket(SUPABASE_STORAGE_BUCKET, key, expires_in)


def create_signed_url_for_bucket(
    bucket: str,
    key: str,
    expires_in: Optional[int] = None,
) -> Optional[str]:
    _require_supabase_settings()
    try:
        response = requests.post(
            _storage_sign_url_for_bucket(bucket, key),
            headers={
                **_headers(),
                "Content-Type": "application/json",
            },
            json={"expiresIn": expires_in or SUPABASE_STORAGE_SIGNED_URL_EXPIRES},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException:
        return None

    signed_url = data.get("signedURL") or data.get("signedUrl") or data.get("url")
    if not signed_url:
        return None
    if signed_url.startswith("http"):
        return signed_url
    return f"{SUPABASE_URL.rstrip('/')}/storage/v1{signed_url}"


def readable_url_for_image(image_url: str) -> str:
    parsed = parse_storage_public_url(image_url)
    if parsed:
        signed_url = create_signed_url_for_bucket(parsed["bucket"], parsed["key"])
        return signed_url or image_url

    key = key_from_public_url(image_url)
    if not key:
        return image_url
    signed_url = create_signed_url(key)
    return signed_url or image_url


def _extension(filename: Optional[str]) -> str:
    if not filename or "." not in filename:
        return ""
    ext = filename.rsplit(".", 1)[-1].lower()
    if not ext or len(ext) > 10:
        return ""
    return f".{ext}"


def upload_project_image(project_id: int, file: UploadFile) -> str:
    content_type = file.content_type or "application/octet-stream"
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미지 파일만 업로드할 수 있습니다.",
        )

    key = posixpath.join(
        "projects",
        str(project_id),
        f"{uuid.uuid4().hex}{_extension(file.filename)}",
    )

    try:
        response = requests.post(
            _storage_object_url(key),
            headers=_headers(content_type),
            data=file.file,
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
    except requests.HTTPError as exc:
        detail = exc.response.text if exc.response is not None else str(exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Supabase Storage 업로드에 실패했습니다: {detail}",
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Supabase Storage 요청에 실패했습니다: {exc}",
        )

    return public_url_for_key(key)


def delete_project_image_object(image_url: str) -> None:
    key = key_from_public_url(image_url)
    if not key:
        return

    try:
        requests.delete(
            _storage_object_url(key),
            headers=_headers(),
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException:
        pass
