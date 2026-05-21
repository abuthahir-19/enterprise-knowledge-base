import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app import models  # noqa: F401 — registers all models with SQLAlchemy metadata
from app.routers import auth, users, articles, categories, tags, search, files, approvals, collaboration, analytics
from app.core.security import hash_password
from app.config import settings


def _create_default_admin(db: Session) -> None:
    """Create a default admin user if no users exist in the database."""
    from app.models.user import User

    existing = db.query(User).first()
    if existing:
        return

    admin = User(
        name="System Administrator",
        email="admin@company.com",
        hashed_password=hash_password("Admin@123"),
        role="admin",
        department="IT",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    print("[startup] Default admin user created: admin@company.com / Admin@123")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: runs setup on startup."""
    # Create all database tables
    Base.metadata.create_all(bind=engine)

    # Create uploads directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Seed default admin
    db = SessionLocal()
    try:
        _create_default_admin(db)
    finally:
        db.close()

    yield
    # Shutdown logic (if any) goes here


app = FastAPI(
    title="Enterprise Knowledge Base API",
    version="1.0.0",
    description="A comprehensive knowledge base management system with articles, categories, approvals, and analytics.",
    lifespan=lifespan,
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static file serving for uploads ──────────────────────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ─── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(articles.router)
app.include_router(categories.router)
app.include_router(tags.router)
app.include_router(search.router)
app.include_router(files.router)
app.include_router(approvals.router)
app.include_router(collaboration.router)
app.include_router(analytics.router)


# ─── Root endpoint ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Enterprise Knowledge Base API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
