from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import List

from app.router import ai, auth, links, recommendations


def get_cors_origins() -> List[str]:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://overwindow.com",
        "https://www.overwindow.com",
    ]

    cors_origins = os.getenv("CORS_ORIGINS")
    if cors_origins:
        origins.extend(origin.strip() for origin in cors_origins.split(","))

    origins.extend(
        [
            os.getenv("FRONTEND_ORIGIN", ""),
            os.getenv("FRONTEND_ORIGIN2", ""),
        ]
    )

    return list(dict.fromkeys(origin for origin in origins if origin))

app = FastAPI(
    swagger_ui_parameters={"persistAuthorization": True}
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(links.router)
app.include_router(ai.router)
app.include_router(recommendations.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api")
def root():
    return {"message": "Portfolio backend is running"}
