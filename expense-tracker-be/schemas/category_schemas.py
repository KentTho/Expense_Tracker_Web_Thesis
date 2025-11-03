from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class CategoryBase(BaseModel):
    """Schema cơ bản cho danh mục thu/chi"""
    name: str
    type: str                            # "income" hoặc "expense"
    color: Optional[str] = None
    icon: Optional[str] = None


class CategoryCreate(CategoryBase):
    """Schema tạo mới danh mục"""
    pass


class CategoryOut(CategoryBase):
    """Schema trả về khi lấy category từ DB"""
    id: UUID
    # ✅ Quan trọng: Cho phép user_id là Optional (None) để hỗ trợ Default Category
    user_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ✅ Schema dùng cho danh mục mặc định (không có user_id, id, created_at)
# ✅ Bỏ sử dụng DefaultCategoryOut trong routes để chỉ dùng CategoryOut
class DefaultCategoryOut(BaseModel):
    id: Optional[UUID] = None # Giữ lại để tránh lỗi Pydantic
    name: str
    type: str
    icon: Optional[str] = None
    color: Optional[str] = None


# ✅ Schema phản hồi danh sách danh mục mặc định
class DefaultCategoryItem(BaseModel):
    name: str
    icon: str
    color: str


class DefaultCategoryResponse(BaseModel):
    type: str
    categories: List[DefaultCategoryItem]

    class Config:
        orm_mode = True
