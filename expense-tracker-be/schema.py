# ===============================================
# 📄 FILE: schemas.py
# 🎯 Mục đích: Định nghĩa các schema (Pydantic models)
# dùng để validate dữ liệu vào/ra giữa Frontend và Backend
# ===============================================

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID


# =========================================================
# 🧩 1️⃣ USER SCHEMAS
# =========================================================
class UserUpdate(BaseModel):
    """Schema cập nhật thông tin người dùng"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    profile_image: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None


class UserOut(BaseModel):
    """Schema phản hồi thông tin người dùng"""
    id: UUID
    name: Optional[str]
    email: Optional[str]
    profile_image: Optional[str]
    gender: Optional[str]
    birthday: Optional[date]
    created_at: datetime

    model_config = {"from_attributes": True}


class UserSyncPayload(BaseModel):
    """Schema đồng bộ thông tin từ Firebase"""
    email: str
    firebase_uid: str
    display_name: Optional[str] = None


# =========================================================
# 💰 2️⃣ INCOME SCHEMAS
# =========================================================
class IncomeBase(BaseModel):
    """Schema cơ bản cho bảng thu nhập"""
    source: Optional[str] = None
    amount: float
    date: date
    emoji: Optional[str] = None
    category_id: Optional[int] = None   # Liên kết Category (nếu có)
    type: str = "income"                # Đánh dấu loại giao dịch


class IncomeCreate(IncomeBase):
    """Schema tạo mới thu nhập"""
    source: Optional[str]
    amount: float
    date: date
    emoji: Optional[str]


class IncomeOut(IncomeBase):
    """Schema phản hồi thu nhập"""
    id: UUID                                  # ID của bản ghi thu nhập
    user_id: UUID                             # ID của người dùng
    created_at: Optional[datetime] = None     # Thời điểm tạo bản ghi

    # Thông tin category (tuỳ chọn) — giúp FE hiển thị chi tiết danh mục
    category: Optional["CategoryOut"] = None

    model_config = {"from_attributes": True}

# =========================================================
# 💸 3️⃣ EXPENSE SCHEMAS
# =========================================================
class ExpenseBase(BaseModel):
    """Schema cơ bản cho bảng chi tiêu"""
    category: Optional[str] = None
    amount: float
    date: date
    emoji: Optional[str] = None
    category_id: Optional[int] = None   # Liên kết Category (nếu có)
    type: str = "expense"               # Đánh dấu loại giao dịch

class ExpenseCreate(ExpenseBase):
    """Schema tạo mới chi tiêu"""
    category: Optional[str]
    amount: float
    date: date
    emoji: Optional[str]


class ExpenseOut(ExpenseBase):
    """Schema phản hồi chi tiêu"""
    id: UUID
    user_id: UUID
    created_at: Optional[datetime] = None

    # Thông tin category kèm theo (nếu có)
    category: Optional["CategoryOut"] = None

    model_config = {"from_attributes": True}

# =========================================================
# 🗂️ 4️⃣ CATEGORY SCHEMAS
# =========================================================
class CategoryBase(BaseModel):
    """Schema cơ bản cho danh mục thu/chi"""
    name: str
    type: str                           # "income" hoặc "expense"
    color_code: Optional[str] = None    # Mã màu hiển thị (#FF5733)
    icon_name: Optional[str] = None     # Biểu tượng UI (vd: "shopping-cart")


class CategoryCreate(CategoryBase):
    """Schema tạo mới danh mục"""
    pass


class CategoryOut(CategoryBase):
    """Schema phản hồi danh mục"""
    category_id: int
    user_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# =========================================================
# 🔁 5️⃣ TRANSACTION SCHEMAS
# =========================================================
class TransactionBase(BaseModel):
    """Schema cơ bản cho giao dịch tổng hợp"""
    type: str                           # "income" hoặc "expense"
    amount: float
    transaction_date: date
    note: Optional[str] = None
    category_id: Optional[int] = None   # Liên kết danh mục (Category)


class TransactionCreate(TransactionBase):
    """Schema tạo mới giao dịch"""
    pass


class TransactionOut(TransactionBase):
    """Schema phản hồi giao dịch"""
    transaction_id: int
    user_id: UUID
    created_at: datetime
    category: Optional[CategoryOut] = None  # Gắn danh mục (nếu có)

    model_config = {"from_attributes": True}


# =========================================================
# 📊 6️⃣ DASHBOARD / SUMMARY SCHEMAS
# =========================================================
class SummaryOut(BaseModel):
    """Schema phản hồi tổng hợp thu – chi"""
    total_income: float
    total_expense: float
    balance: float


class CategorySummaryOut(BaseModel):
    """Schema thống kê chi tiêu theo danh mục"""
    category: str
    total: float