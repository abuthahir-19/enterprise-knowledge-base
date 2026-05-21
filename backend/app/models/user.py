from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="employee")  # admin/author/reviewer/employee
    department = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    articles = relationship("Article", back_populates="author", foreign_keys="Article.author_id")
    comments = relationship("Comment", back_populates="user")
    ratings = relationship("Rating", back_populates="user")
    bookmarks = relationship("Bookmark", back_populates="user")
    categories_created = relationship("Category", back_populates="creator", foreign_keys="Category.created_by")
    attachments = relationship("Attachment", back_populates="uploader", foreign_keys="Attachment.uploaded_by")
    approval_actions = relationship("ApprovalHistory", back_populates="reviewer", foreign_keys="ApprovalHistory.reviewer_id")
    search_logs = relationship("SearchLog", back_populates="user")
