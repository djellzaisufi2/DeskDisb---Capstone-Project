import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.routers import analytics, auth, floor_plans, reservations, resources, users

os.makedirs(settings.upload_dir, exist_ok=True)

app = FastAPI(title="DeskDibs API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(resources.router, prefix="/api")
app.include_router(reservations.router, prefix="/api")
app.include_router(floor_plans.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(users.router, prefix="/api")

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health():
    return {"status": "ok"}
