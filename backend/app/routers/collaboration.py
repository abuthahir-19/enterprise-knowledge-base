from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.article import Article
from app.models.comment import Comment
from app.models.rating import Rating
from app.models.bookmark import Bookmark
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from app.schemas.rating import RatingCreate, RatingResponse
from sqlalchemy import func

router = APIRouter(prefix="/api/collaboration", tags=["Collaboration"])


# ─── Comments ──────────────────────────────────────────────────────────────────

@router.get("/articles/{article_id}/comments", response_model=List[CommentResponse])
def get_comments(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get all top-level comments (with nested replies) for an article."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    # Return only root comments; replies are loaded via relationship
    comments = (
        db.query(Comment)
        .filter(Comment.article_id == article_id, Comment.parent_id == None)  # noqa: E711
        .order_by(Comment.created_at.asc())
        .all()
    )
    return [CommentResponse.model_validate(c) for c in comments]


@router.post("/articles/{article_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    article_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add a comment to an article (optionally as a reply)."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    if comment_data.parent_id:
        parent = db.query(Comment).filter(
            Comment.id == comment_data.parent_id,
            Comment.article_id == article_id,
        ).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found in this article",
            )

    comment = Comment(
        content=comment_data.content,
        user_id=current_user.id,
        article_id=article_id,
        parent_id=comment_data.parent_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return CommentResponse.model_validate(comment)


@router.put("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a comment (owner only)."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    if comment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this comment")

    comment.content = comment_data.content
    db.commit()
    db.refresh(comment)
    return CommentResponse.model_validate(comment)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_200_OK)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a comment (owner or admin)."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    if current_user.role != "admin" and comment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this comment")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}


# ─── Ratings ───────────────────────────────────────────────────────────────────

@router.post("/articles/{article_id}/rate", response_model=RatingResponse)
def rate_article(
    article_id: int,
    rating_data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Rate an article (1-5). Upserts if the user already rated it."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    existing = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.article_id == article_id,
    ).first()

    if existing:
        existing.value = rating_data.value
        db.commit()
        db.refresh(existing)
        return existing
    else:
        rating = Rating(
            value=rating_data.value,
            user_id=current_user.id,
            article_id=article_id,
        )
        db.add(rating)
        db.commit()
        db.refresh(rating)
        return rating


@router.get("/articles/{article_id}/rating", response_model=dict)
def get_article_rating(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get the average rating and current user's own rating for an article."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    avg = db.query(func.avg(Rating.value)).filter(Rating.article_id == article_id).scalar()
    count = db.query(func.count(Rating.id)).filter(Rating.article_id == article_id).scalar()

    user_rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.article_id == article_id,
    ).first()

    return {
        "article_id": article_id,
        "average_rating": round(float(avg), 2) if avg else None,
        "rating_count": count,
        "user_rating": user_rating.value if user_rating else None,
    }


# ─── Bookmarks ─────────────────────────────────────────────────────────────────

@router.post("/articles/{article_id}/bookmark", status_code=status.HTTP_201_CREATED)
def bookmark_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Bookmark an article."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    existing = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.article_id == article_id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Article is already bookmarked",
        )

    bookmark = Bookmark(user_id=current_user.id, article_id=article_id)
    db.add(bookmark)
    db.commit()
    return {"message": "Article bookmarked successfully", "article_id": article_id}


@router.delete("/articles/{article_id}/bookmark", status_code=status.HTTP_200_OK)
def remove_bookmark(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove a bookmark."""
    bookmark = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.article_id == article_id,
    ).first()
    if not bookmark:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found")

    db.delete(bookmark)
    db.commit()
    return {"message": "Bookmark removed successfully", "article_id": article_id}


@router.get("/articles/{article_id}/bookmark", response_model=dict)
def check_bookmark(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check if the current user has bookmarked an article."""
    bookmark = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.article_id == article_id,
    ).first()
    return {
        "article_id": article_id,
        "is_bookmarked": bookmark is not None,
    }
