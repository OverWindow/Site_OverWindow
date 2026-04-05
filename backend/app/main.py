from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.router import auth, links

app = FastAPI(
    swagger_ui_parameters={"persistAuthorization": True}
)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(links.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api")
def root():
    return {"message": "Portfolio backend is running"}