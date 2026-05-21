from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.deps import get_db, get_current_active_user, require_roles
from app.models.user import User
from app.models.article import Article
from app.models.approval import ApprovalHistory
from app.schemas.article import ArticleSummary

router = APIRouter(prefix="/api/approvals", tags=["Approvals"])


class ApprovalAction(BaseModel):
    comments: str = ""


class ApprovalHistoryResponse(BaseModel):
    id: int
    article_id: int
    reviewer_id: int | None = None
    action: str
    comments: str | None = None
    created_at: str

    class Config:
        from_attributes = True


@router.get("/pending", response_model=List[ArticleSummary])
def get_pending_approvals(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List articles pending approval (reviewer or admin only)."""
    if current_user.role not in ("reviewer", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Reviewer or admin access required")

    articles = (
        db.query(Article)
        .filter(Article.status == "pending_approval")
        .order_by(Article.updated_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [ArticleSummary.model_validate(a) for a in articles]


@router.post("/{article_id}/approve", response_model=dict)
def approve_article(
    article_id: int,
    action: ApprovalAction = ApprovalAction(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Approve an article (reviewer or admin only)."""
    if current_user.role not in ("reviewer", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Reviewer or admin access required")

    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    if article.status != "pending_approval":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Article status is '{article.status}'. Only 'pending_approval' articles can be approved.",
        )

    article.status = "approved"
    article.rejection_reason = None

    history = ApprovalHistory(
        article_id=article.id,
        reviewer_id=current_user.id,
        action="approved",
        comments=action.comments or None,
    )
    db.add(history)
    db.commit()
    return {"message": "Article approved successfully", "article_id": article_id, "status": "approved"}


@router.post("/{article_id}/reject", response_model=dict)
def reject_article(
    article_id: int,
    action: ApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Reject an article with a reason (reviewer or admin only)."""
    if current_user.role not in ("reviewer", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Reviewer or admin access required")

    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    if article.status != "pending_approval":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Article status is '{article.status}'. Only 'pending_approval' articles can be rejected.",
        )

    if not action.comments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason (comments) is required",
        )

    article.status = "rejected"
    article.rejection_reason = action.comments

    history = ApprovalHistory(
        article_id=article.id,
        reviewer_id=current_user.id,
        action="rejected",
        comments=action.comments,
    )
    db.add(history)
    db.commit()
    return {"message": "Article rejected", "article_id": article_id, "status": "rejected", "reason": action.comments}


@router.get("/history/{article_id}", response_model=List[dict])
def get_approval_history(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get the approval history for a specific article."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    history = (
        db.query(ApprovalHistory)
        .filter(ApprovalHistory.article_id == article_id)
        .order_by(ApprovalHistory.created_at.desc())
        .all()
    )

    return [
        {
            "id": h.id,
            "article_id": h.article_id,
            "reviewer_id": h.reviewer_id,
            "reviewer_name": h.reviewer.name if h.reviewer else None,
            "action": h.action,
            "comments": h.comments,
            "created_at": h.created_at.isoformat(),
        }
        for h in history
    ]
