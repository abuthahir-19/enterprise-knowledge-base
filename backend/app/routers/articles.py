from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.deps import get_db, get_current_active_user, require_roles
from app.models.user import User
from app.models.article import Article
from app.models.tag import Tag
from app.models.bookmark import Bookmark
from app.models.rating import Rating
from app.schemas.article import ArticleCreate, ArticleUpdate, ArticleResponse, ArticleSummary

router = APIRouter(prefix="/api/articles", tags=["Articles"])


def _compute_article_extras(article: Article, db: Session) -> dict:
    """Compute average_rating and comment_count for an article."""
    avg = (
        db.query(func.avg(Rating.value))
        .filter(Rating.article_id == article.id)
        .scalar()
    )
    comment_count = len([c for c in article.comments if c.parent_id is None]) + sum(
        len(c.replies) for c in article.comments if c.parent_id is None
    )
    # Simpler: just count all comments
    comment_count = len(article.comments)
    return {
        "average_rating": round(float(avg), 2) if avg else None,
        "comment_count": comment_count,
    }


def _build_article_response(article: Article, db: Session) -> ArticleResponse:
    extras = _compute_article_extras(article, db)
    data = ArticleResponse.model_validate(article)
    data.average_rating = extras["average_rating"]
    data.comment_count = extras["comment_count"]
    return data


@router.get("/", response_model=List[ArticleSummary])
def list_articles(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_id: Optional[int] = None,
    author_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List articles with filters.
    - Employees see only published articles.
    - Authors see own articles (any status) + published by others.
    - Reviewers and admins see all.
    """
    query = db.query(Article)

    if current_user.role in ("admin", "reviewer"):
        # Can see everything
        if status_filter:
            query = query.filter(Article.status == status_filter)
    elif current_user.role == "author":
        # See own articles (any status) + others' published
        if status_filter:
            query = query.filter(
                ((Article.author_id == current_user.id) | (Article.status == "published"))
                & (Article.status == status_filter)
            )
        else:
            query = query.filter(
                (Article.author_id == current_user.id) | (Article.status == "published")
            )
    else:
        # Employee: only published
        query = query.filter(Article.status == "published")
        if status_filter and status_filter != "published":
            return []

    if category_id:
        query = query.filter(Article.category_id == category_id)
    if author_id:
        query = query.filter(Article.author_id == author_id)

    articles = query.order_by(Article.created_at.desc()).offset(skip).limit(limit).all()

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
    return results


@router.post("/", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
def create_article(
    article_data: ArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new article (author or admin)."""
    if current_user.role not in ("author", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authors and admins can create articles",
        )

    # Fetch tags
    tags = []
    if article_data.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(article_data.tag_ids)).all()

    new_article = Article(
        title=article_data.title,
        description=article_data.description,
        content=article_data.content,
        status="draft",
        author_id=current_user.id,
        category_id=article_data.category_id,
        tags=tags,
    )
    db.add(new_article)
    db.commit()
    db.refresh(new_article)
    return _build_article_response(new_article, db)


@router.get("/my", response_model=List[ArticleSummary])
def get_my_articles(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get articles created by the current user."""
    articles = (
        db.query(Article)
        .filter(Article.author_id == current_user.id)
        .order_by(Article.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
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
    return results


@router.get("/bookmarked", response_model=List[ArticleSummary])
def get_bookmarked_articles(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get articles bookmarked by the current user."""
    bookmarks = (
        db.query(Bookmark)
        .filter(Bookmark.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    results = []
    for bm in bookmarks:
        article = bm.article
        if article:
            avg = (
                db.query(func.avg(Rating.value))
                .filter(Rating.article_id == article.id)
                .scalar()
            )
            summary = ArticleSummary.model_validate(article)
            summary.average_rating = round(float(avg), 2) if avg else None
            results.append(summary)
    return results


@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get an article by ID. Increments view_count if published."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    # Access control: employees can only view published
    if current_user.role == "employee" and article.status != "published":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == "author" and article.status != "published" and article.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Increment view count only for published articles
    if article.status == "published":
        article.view_count += 1
        db.commit()
        db.refresh(article)

    return _build_article_response(article, db)


@router.put("/{article_id}", response_model=ArticleResponse)
def update_article(
    article_id: int,
    article_data: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update article (owner or admin only)."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    if current_user.role != "admin" and article.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this article")

    if article_data.title is not None:
        article.title = article_data.title
    if article_data.description is not None:
        article.description = article_data.description
    if article_data.content is not None:
        article.content = article_data.content
    if article_data.category_id is not None:
        article.category_id = article_data.category_id
    if article_data.tag_ids is not None:
        tags = db.query(Tag).filter(Tag.id.in_(article_data.tag_ids)).all()
        article.tags = tags

    db.commit()
    db.refresh(article)
    return _build_article_response(article, db)


@router.delete("/{article_id}", status_code=status.HTTP_200_OK)
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete article (owner or admin only)."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    if current_user.role != "admin" and article.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this article")

    db.delete(article)
    db.commit()
    return {"message": "Article deleted successfully"}


@router.post("/{article_id}/submit", response_model=ArticleResponse)
def submit_for_approval(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Submit a draft article for approval (author or admin)."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    if current_user.role != "admin" and article.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if article.status not in ("draft", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit article with status '{article.status}'. Must be 'draft' or 'rejected'.",
        )

    article.status = "pending_approval"
    db.commit()
    db.refresh(article)
    return _build_article_response(article, db)


@router.post("/{article_id}/publish", response_model=ArticleResponse)
def publish_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Publish an approved article (admin or reviewer)."""
    if current_user.role not in ("admin", "reviewer"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin or reviewer required")

    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    if article.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot publish article with status '{article.status}'. Must be 'approved'.",
        )

    article.status = "published"
    db.commit()
    db.refresh(article)
    return _build_article_response(article, db)


@router.post("/{article_id}/archive", response_model=ArticleResponse)
def archive_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Archive a published article (author or admin)."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    if current_user.role != "admin" and article.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    article.status = "archived"
    db.commit()
    db.refresh(article)
    return _build_article_response(article, db)


@router.post("/{article_id}/unarchive", response_model=ArticleResponse)
def unarchive_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Unarchive an archived article back to published (author or admin)."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    if current_user.role != "admin" and article.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if article.status != "archived":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Article is not archived",
        )

    article.status = "published"
    db.commit()
    db.refresh(article)
    return _build_article_response(article, db)
