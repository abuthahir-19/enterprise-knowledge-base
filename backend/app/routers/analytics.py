from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.article import Article
from app.models.category import Category
from app.models.rating import Rating
from app.models.search_log import SearchLog
from app.schemas.analytics import DashboardMetrics, PopularArticle, UserActivity

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return high-level dashboard metrics."""
    total_articles = db.query(func.count(Article.id)).scalar() or 0
    published_articles = (
        db.query(func.count(Article.id)).filter(Article.status == "published").scalar() or 0
    )
    pending_approvals = (
        db.query(func.count(Article.id)).filter(Article.status == "pending_approval").scalar() or 0
    )
    total_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0  # noqa: E712
    total_categories = db.query(func.count(Category.id)).scalar() or 0
    total_views = db.query(func.sum(Article.view_count)).scalar() or 0

    return DashboardMetrics(
        total_articles=total_articles,
        published_articles=published_articles,
        pending_approvals=pending_approvals,
        total_users=total_users,
        total_categories=total_categories,
        total_views=total_views,
    )


@router.get("/popular-articles", response_model=List[PopularArticle])
def get_popular_articles(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return top articles ordered by view count."""
    articles = (
        db.query(Article)
        .filter(Article.status == "published")
        .order_by(desc(Article.view_count))
        .limit(limit)
        .all()
    )

    results = []
    for article in articles:
        avg = (
            db.query(func.avg(Rating.value)).filter(Rating.article_id == article.id).scalar()
        )
        results.append(
            PopularArticle(
                id=article.id,
                title=article.title,
                view_count=article.view_count,
                average_rating=round(float(avg), 2) if avg else None,
            )
        )
    return results


@router.get("/active-users", response_model=List[UserActivity])
def get_active_users(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return users with the most published articles."""
    rows = (
        db.query(
            User.id,
            User.name,
            func.count(Article.id).label("article_count"),
            func.max(Article.updated_at).label("last_active"),
        )
        .join(Article, Article.author_id == User.id)
        .filter(Article.status == "published")
        .group_by(User.id, User.name)
        .order_by(desc("article_count"))
        .limit(limit)
        .all()
    )

    return [
        UserActivity(
            user_id=row.id,
            name=row.name,
            article_count=row.article_count,
            last_active=row.last_active.isoformat() if row.last_active else None,
        )
        for row in rows
    ]


@router.get("/recent-articles")
def get_recent_articles(
    limit: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return the most recently created articles."""
    articles = (
        db.query(Article)
        .order_by(desc(Article.created_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": a.id,
            "title": a.title,
            "status": a.status,
            "author_id": a.author_id,
            "author_name": a.author.name if a.author else None,
            "created_at": a.created_at.isoformat(),
            "view_count": a.view_count,
        }
        for a in articles
    ]


@router.get("/category-stats")
def get_category_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return article count per category."""
    rows = (
        db.query(
            Category.id,
            Category.name,
            func.count(Article.id).label("article_count"),
        )
        .outerjoin(Article, Article.category_id == Category.id)
        .group_by(Category.id, Category.name)
        .order_by(desc("article_count"))
        .all()
    )
    return [
        {"category_id": row.id, "category_name": row.name, "article_count": row.article_count}
        for row in rows
    ]


@router.get("/search-trends")
def get_search_trends(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return top search terms grouped by query string."""
    rows = (
        db.query(
            SearchLog.query,
            func.count(SearchLog.id).label("search_count"),
        )
        .group_by(SearchLog.query)
        .order_by(desc("search_count"))
        .limit(limit)
        .all()
    )
    return [{"query": row.query, "search_count": row.search_count} for row in rows]
