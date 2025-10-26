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
    category_name: Optional[str] = None
    amount: float
    date: date
    emoji: Optional[str] = None
    category_id: Optional[UUID] = None   # Liên kết Category (nếu có)


class IncomeCreate(IncomeBase):
    """Schema tạo mới thu nhập"""
    pass


class CategoryOut(BaseModel):
    """Schema phản hồi danh mục"""
    id: UUID
    user_id: UUID
    name: str
    type: str
    color: Optional[str] = None
    icon: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class IncomeOut(IncomeBase):
    """Schema phản hồi thu nhập"""
    id: UUID
    user_id: UUID
    created_at: Optional[datetime] = None
    category: Optional[CategoryOut] = None

    model_config = {"from_attributes": True}


# =========================================================
# 💸 3️⃣ EXPENSE SCHEMAS
# =========================================================
class ExpenseBase(BaseModel):
    """Schema cơ bản cho bảng chi tiêu"""
    category_name: Optional[str] = None
    amount: float
    date: date
    emoji: Optional[str] = None
    category_id: Optional[UUID] = None   # Liên kết Category (nếu có)


class ExpenseCreate(ExpenseBase):
    """Schema tạo mới chi tiêu"""
    pass


class ExpenseOut(ExpenseBase):
    """Schema phản hồi chi tiêu"""
    id: UUID
    user_id: UUID
    created_at: Optional[datetime] = None
    category: Optional[CategoryOut] = None

    model_config = {"from_attributes": True}


# =========================================================
# 🏷️ 4️⃣ CATEGORY SCHEMAS
# =========================================================
class CategoryBase(BaseModel):
    """Schema cơ bản cho danh mục thu/chi"""
    name: str
    type: str                           # "income" hoặc "expense"
    color: Optional[str] = None
    icon: Optional[str] = None


class CategoryCreate(CategoryBase):
    """Schema tạo mới danh mục"""
    pass


# CategoryOut đã được định nghĩa phía trên, giữ nguyên

class DefaultCategoryItem(BaseModel):
    name: str
    icon: str
    color: str

class DefaultCategoryResponse(BaseModel):
    type: str
    categories: List[DefaultCategoryItem]

    class Config:
        orm_mode = True

class CategoryOut(CategoryBase):
    """Schema trả về khi lấy category từ DB"""
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        orm_mode = True


# ✅ Schema mới cho danh mục mặc định (không cần id, user_id, created_at)
class DefaultCategoryOut(BaseModel):
    name: str
    type: str
    icon: Optional[str] = None
    color: Optional[str] = None

# =========================================================
# 🔁 5️⃣ TRANSACTION SCHEMAS
# =========================================================
class TransactionBase(BaseModel):
    """Schema cơ bản cho giao dịch tổng hợp"""
    type: str                           # "income" hoặc "expense"
    amount: float
    transaction_date: date
    note: Optional[str] = None
    source_or_category: Optional[str] = None
    category_id: Optional[UUID] = None


class TransactionCreate(TransactionBase):
    """Schema tạo mới giao dịch"""
    pass


class TransactionOut(TransactionBase):
    """Schema phản hồi giao dịch"""
    id: UUID
    user_id: UUID
    created_at: datetime
    category: Optional[CategoryOut] = None

    model_config = {"from_attributes": True}


class RecentTransactionOut(BaseModel):
    """Schema cho giao dịch gần đây"""
    id: UUID
    type: str
    emoji: Optional[str]
    amount: float
    transaction_date: date
    category_name: Optional[str]


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


# ======================================================
# 📈 7️⃣ DASHBOARD / ANALYTICS SCHEMAS
# ======================================================
class SummaryStats(BaseModel):
    total_income: float
    total_expense: float
    total_balance: float


class ChartPoint(BaseModel):
    date: date
    total: float


class DashboardResponse(BaseModel):
    summary: SummaryStats
    recent_transactions: List[RecentTransactionOut]
    income_chart: List[ChartPoint]
    expense_chart: List[ChartPoint]


# ======================================================
# 📤 8️⃣ EXPORT SCHEMA
# ======================================================
class ExportResponse(BaseModel):
    message: str
    file_url: str
