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
