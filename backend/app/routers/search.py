from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.article import Article
from app.models.tag import Tag, article_tags
from app.models.rating import Rating
from app.models.search_log import SearchLog
from app.schemas.article import ArticleSummary

router = APIRouter(prefix="/api/search", tags=["Search"])


@router.get("/", response_model=dict)
def search_articles(
    q: Optional[str] = Query(None, description="Search query string"),
    category_id: Optional[int] = None,
    tag_id: Optional[int] = None,
    author_id: Optional[int] = None,
    status: str = Query("published", description="Article status filter"),
    sort: str = Query("latest", description="Sort order: 'latest' or 'popular'"),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Search articles with full-text ilike search on title, description, content.
    Returns list of ArticleSummary and total_count.
    """
    query = db.query(Article)

    # Status filter — employees can only see published
    if current_user.role in ("employee",):
        query = query.filter(Article.status == "published")
    elif current_user.role == "author":
        query = query.filter(
            (Article.author_id == current_user.id) | (Article.status == status)
        )
    else:
        query = query.filter(Article.status == status)

    # Full text search
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            Article.title.ilike(search_term)
            | Article.description.ilike(search_term)
            | Article.content.ilike(search_term)
        )

    # Category filter
    if category_id:
        query = query.filter(Article.category_id == category_id)

    # Tag filter via association table
    if tag_id:
        query = query.join(article_tags, Article.id == article_tags.c.article_id).filter(
            article_tags.c.tag_id == tag_id
        )

    # Author filter
    if author_id:
        query = query.filter(Article.author_id == author_id)

    # Total count
    total_count = query.count()

    # Sorting
    if sort == "popular":
        query = query.order_by(Article.view_count.desc())
    else:
        query = query.order_by(Article.created_at.desc())

    articles = query.offset(skip).limit(limit).all()

    # Log search query
    if q:
        search_log = SearchLog(
            query=q,
            user_id=current_user.id,
            results_count=total_count,
        )
        db.add(search_log)
        db.commit()

    results = []
    for article in articles:
        avg = (
            db.query(func.avg(Rating.value))
            .filter(Rating.article_id == article.id)
            .scalar()
        )
        summary = ArticleSummary.model_validate(article)
        summary.average_rating = round(float(avg), 2) if avg else None
        results.append(summary)

    return {
        "total_count": total_count,
        "results": [r.model_dump() for r in results],
        "skip": skip,
        "limit": limit,
    }
