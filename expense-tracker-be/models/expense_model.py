import uuid

from sqlalchemy import (
    Column,
    String,
    Numeric,
    Date,
    DateTime,
    ForeignKey,
    func,
    Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base
from sqlalchemy import Index


# ======================================================
# 💸 EXPENSE MODEL
# ======================================================
class Expense(Base):
    __tablename__ = "expenses"
    __table_args__ = (
        Index('ix_expense_user_date', 'user_id', 'date'),  # Query báo cáo tháng siêu nhanh
        Index('ix_expense_category_date', 'category_id', 'date'),
    )


    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)

    category_name = Column(String(255))
    amount = Column(Numeric(14, 2), nullable=False)
    currency_code = Column(String(3), default="USD", nullable=False)  # 💡 Bổ sung
    date = Column(Date, nullable=False)
    emoji = Column(String(64), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Quan hệ
    user = relationship("User", foreign_keys=[user_id], viewonly=True, overlaps="expenses,transactions")
    category = relationship("Category", foreign_keys=[category_id], viewonly=True, overlaps="expenses,transactions")
