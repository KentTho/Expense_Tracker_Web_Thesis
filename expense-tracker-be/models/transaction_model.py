import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    Numeric,
    Date,
    DateTime,
    ForeignKey,
    func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base

# ======================================================
# 🔄 TRANSACTION MODEL
# ======================================================
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)

    type = Column(String(10), nullable=False)  # 'income' hoặc 'expense'
    amount = Column(Numeric(14, 2), nullable=False)
    source_or_category = Column(String(255))
    note = Column(Text)
    transaction_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Quan hệ
    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")