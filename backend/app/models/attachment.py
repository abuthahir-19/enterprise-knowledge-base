from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)           # stored UUID-based filename
    original_name = Column(String, nullable=False)      # original upload name
    file_type = Column(String, nullable=False)          # mime type or extension
    file_size = Column(Integer, nullable=False)         # bytes
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    article = relationship("Article", back_populates="attachments")
    uploader = relationship("User", back_populates="attachments", foreign_keys=[uploaded_by])
