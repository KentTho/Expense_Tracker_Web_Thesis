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
    currency_code = Column(String(3), default="USD", nullable=False)
    category_name = Column(String(255)) # Lưu tên để hiển thị nhanh
    emoji = Column(String(64), nullable=True)
    note = Column(Text, nullable=True)
    date = Column(Date, nullable=False, default=func.current_date())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Quan hệ
    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")