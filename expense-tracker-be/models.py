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


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    firebase_uid = Column(String(255), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password = Column(String(255), nullable=True)  # nullable because Firebase manages password
    name = Column(String(255), nullable=True)
    gender = Column(String(20), nullable=True)  # ví dụ: "male", "female", "other"
    birthday = Column(Date, nullable=True)
    profile_image = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    incomes = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")


class Income(Base):
    __tablename__ = "incomes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    source = Column(String(255))
    amount = Column(Numeric(14, 2), nullable=False)
    date = Column(Date, nullable=False)
    emoji = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="incomes")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(255))
    amount = Column(Numeric(14, 2), nullable=False)
    date = Column(Date, nullable=False)
    emoji = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="expenses")
