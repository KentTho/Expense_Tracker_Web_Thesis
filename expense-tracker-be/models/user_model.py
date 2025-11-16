import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    Date,
    DateTime,
    func,
    Boolean
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

    # --- CÁC CỘT MỚI CHO BẢO MẬT ---

    # 1. Cho Xác thực 2 yếu tố (2FA)
    is_2fa_enabled: sa.Column[bool] = sa.Column(sa.Boolean, default=False, nullable=False)

    # Secret key (dạng text) để tạo mã 2FA, được mã hóa trước khi lưu
    otp_secret: sa.Column[str] = sa.Column(sa.String, nullable=True)

    # 2. Cho Giới hạn phiên đăng nhập
    restrict_multi_device: sa.Column[bool] = sa.Column(sa.Boolean, default=False, nullable=False)

    # (Tùy chọn nâng cao) Lưu phiên đăng nhập cuối cùng
    last_session_key: sa.Column[str] = sa.Column(sa.String, nullable=True)
    # ✅ THÊM DÒNG NÀY
    is_admin: sa.Column[bool] = sa.Column(sa.Boolean, default=False, nullable=False)

    # Quan hệ (Relationship)
    incomes = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")