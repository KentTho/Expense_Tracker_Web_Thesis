import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base

# ======================================================
# 🏷️ CATEGORY MODEL
# ======================================================
class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True) # Cho phép NULL cho Default Categories
    name = Column(String(100), nullable=False)
    type = Column(String(10), nullable=False)  # 'income' hoặc 'expense'
    color = Column(String(10))
    icon = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Quan hệ (Hợp nhất về bảng Transaction)
    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category", cascade="all, delete-orphan")
    incomes = relationship(
        "Transaction",
        primaryjoin="and_(Category.id==Transaction.category_id, Transaction.type=='income')",
        viewonly=True
    )
    expenses = relationship(
        "Transaction",
        primaryjoin="and_(Category.id==Transaction.category_id, Transaction.type=='expense')",
        viewonly=True
    )