# Site_Overwidow

## Backend local run

Python 3.12 환경을 권장합니다. Python 3.13에서는 현재 고정된 SQLAlchemy 버전과 충돌할 수 있습니다.

처음 한 번 venv를 다시 만들 때:

```powershell
cd backend
deactivate
Remove-Item -Recurse -Force .\venv
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

서버 실행:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

`uvicorn`을 바로 실행했을 때 Python 3.13 전역 패키지가 잡히면 SQLAlchemy import 오류가 날 수 있습니다. 위처럼 venv 활성화 후 `python -m uvicorn ...`으로 실행하세요.

API health check:

```powershell
curl http://localhost:8000/api/health
```

Docker Compose로 전체 스택을 띄울 때:

```powershell
docker compose up --build
```

## Backend CORS

Railway 백엔드 환경변수에 프론트 도메인을 쉼표로 넣어두세요.

```env
CORS_ORIGINS=https://overwindow.com,https://www.overwindow.com
```

`www`가 붙은 도메인과 안 붙은 도메인은 브라우저에서 서로 다른 origin으로 취급됩니다.

## Project API

공개 조회:

```http
GET /projects/public
GET /projects/public/{project_key}
```

관리자 API는 기존 로그인 토큰을 `Authorization: Bearer <access_token>` 헤더로 보내야 합니다.

```http
GET    /projects/admin
GET    /projects/admin/{project_id}
POST   /projects/admin
PATCH  /projects/admin/{project_id}
DELETE /projects/admin/{project_id}
POST   /projects/admin/{project_id}/images
PATCH  /projects/admin/images/{image_id}
DELETE /projects/admin/images/{image_id}
```

프로젝트 생성/수정 JSON 예시:

```json
{
  "project_key": "overwindow",
  "title": "OverWindow",
  "subtitle": "Portfolio project",
  "description": "프로젝트 설명",
  "content_json": { "sections": [] },
  "github_url": "https://github.com/example/repo",
  "demo_url": "https://www.overwindow.com",
  "tech_stack": ["React", "FastAPI", "MySQL"],
  "started_at": "2026-01-01",
  "ended_at": null,
  "is_featured": true,
  "is_visible": true,
  "sort_order": 0,
  "images": [
    {
      "image_url": "https://cdn.example.com/projects/overwindow/thumbnail.png",
      "alt_text": "OverWindow thumbnail",
      "caption": "Main screen",
      "image_type": "thumbnail",
      "is_thumbnail": true,
      "sort_order": 0
    }
  ]
}
```

Supabase Storage 이미지 업로드는 `multipart/form-data`로 호출합니다.

```http
POST /projects/admin/{project_id}/images
```

필드:

```text
file: 이미지 파일
alt_text: optional
caption: optional
image_type: screenshot | thumbnail 등
is_thumbnail: true | false
sort_order: number
```

Supabase Storage 환경변수:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<Legacy service_role JWT key>
SUPABASE_STORAGE_BUCKET=project-images
SUPABASE_STORAGE_PUBLIC_BASE_URL=
SUPABASE_STORAGE_SIGNED_URL_EXPIRES=3600
```

`SUPABASE_SERVICE_ROLE_KEY`는 서버 환경변수에만 넣고 프론트엔드에 노출하지 마세요. 이 값은 Supabase Dashboard의 Settings > API Keys > Legacy anon, service_role API keys 탭에 있는 `service_role` JWT 키를 사용하세요. `sb_secret_...` 형식의 새 Secret key를 넣으면 Storage REST API에서 `Invalid Compact JWS` 오류가 납니다.

버킷이 public이면 `SUPABASE_STORAGE_PUBLIC_BASE_URL`은 생략해도 되고, 이 경우 기본 공개 URL은 `https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>` 형식으로 생성됩니다. 별도 CDN/custom domain을 쓰면 `SUPABASE_STORAGE_PUBLIC_BASE_URL`에 그 공개 base URL을 넣으면 됩니다.

버킷이 private이면 프로젝트 조회 API가 `SUPABASE_STORAGE_SIGNED_URL_EXPIRES` 초 동안 유효한 signed URL을 `image_url`에 담아 내려줍니다. 공개 포트폴리오 이미지라면 Supabase Storage bucket을 public으로 두는 편이 캐싱과 성능 면에서 더 단순합니다.
