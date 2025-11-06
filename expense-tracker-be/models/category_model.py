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

    # Quan hệ
    user = relationship("User", back_populates="categories")
    incomes = relationship("Income", back_populates="category")
    expenses = relationship("Expense", back_populates="category")
    transactions = relationship("Transaction", back_populates="category")