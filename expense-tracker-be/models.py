import uuid
from datetime import datetime
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
# 👤 USER MODEL
# ======================================================
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    firebase_uid = Column(String(255), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password = Column(String(255), nullable=True)  # Firebase quản lý
    name = Column(String(255), nullable=True)
    gender = Column(String(20), nullable=True)
    birthday = Column(Date, nullable=True)
    profile_image = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # ✅ THÊM: Cài đặt tiền tệ của người dùng
    currency_code = Column(String(5), nullable=False, default="USD")
    currency_symbol = Column(String(5), nullable=False, default="$")


    # Quan hệ
    incomes = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")


# ======================================================
# 💰 INCOME MODEL
# ======================================================
class Income(Base):
    __tablename__ = "incomes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)

    category_name = Column(String(255))
    amount = Column(Numeric(14, 2), nullable=False)
    date = Column(Date, nullable=False)
    emoji = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="incomes")
    category = relationship("Category", back_populates="incomes")


# ======================================================
# 💸 EXPENSE MODEL
# ======================================================
class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)

    category_name = Column(String(255))
    amount = Column(Numeric(14, 2), nullable=False)
    date = Column(Date, nullable=False)
    emoji = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="expenses")
    category = relationship("Category", back_populates="expenses")


# ======================================================
# 🏷️ CATEGORY MODEL
# ======================================================
class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # ❌ KHẮC PHỤC: Cho phép NULL để lưu Default Categories (user_id=None)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(100), nullable=False)
    type = Column(String(10), nullable=False)  # 'income' hoặc 'expense'
    color = Column(String(10))
    icon = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="categories")
    incomes = relationship("Income", back_populates="category")
    expenses = relationship("Expense", back_populates="category")
    transactions = relationship("Transaction", back_populates="category")


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
    source_or_category = Column(String(255))  # Dùng chung cho source (thu) hoặc category_name (chi)
    note = Column(Text)
    transaction_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")