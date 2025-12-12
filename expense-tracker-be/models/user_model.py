import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    Date,
    DateTime,
    func,
    Numeric, Boolean
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base # Giả định Base được import từ đây
import sqlalchemy as sa

# ======================================================
# 👤 USER MODEL
# ======================================================
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    firebase_uid = Column(String(255), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    gender = Column(String(20), nullable=True)
    birthday = Column(Date, nullable=True)
    profile_image = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    currency_code = Column(String(5), nullable=False, default="USD")
    currency_symbol = Column(String(5), nullable=False, default="$")
    is_2fa_enabled: sa.Column[bool] = sa.Column(sa.Boolean, default=False, nullable=False)
    otp_secret: sa.Column[str] = sa.Column(sa.String, nullable=True)
    restrict_multi_device: sa.Column[bool] = sa.Column(sa.Boolean, default=False, nullable=False)
    last_session_key: sa.Column[str] = sa.Column(sa.String, nullable=True)
    is_admin: sa.Column[bool] = sa.Column(sa.Boolean, default=False, nullable=False)
    monthly_budget = Column(Numeric(14, 2), default=0, nullable=True)
    has_onboard = Column(Boolean, default=False, nullable=False)
    is_email_verified = Column(Boolean, default=False)

    # Quan hệ (Relationship)
    incomes = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")