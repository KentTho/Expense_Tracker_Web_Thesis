# cruds/crud_category.py (Đã dọn dẹp, sáng tạo hơn)
from typing import Optional

from sqlalchemy import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException
from models import category_model
import uuid


# =========================================================
# 🗂️ CATEGORY CRUD OPERATIONS (Dành cho User)
# =========================================================
# (Các hàm create_category, list_categories_for_user, update_category, delete_category giữ nguyên)

def create_category(db: Session, user_id: UUID, name: str, type: str, color: str = None, icon: str = None):
    category = category_model.Category(
        id=uuid.uuid4(),
        user_id=user_id,
        name=name,
        type=type,
        color=color,
        icon=icon,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def list_all_categories_for_user(db: Session, user_id: UUID, type_filter: str = None):
    """
    Lấy danh sách Categories bao gồm:
    1. Categories do người dùng tạo (user_id == user_id)
    2. Default Categories (user_id == None)
    """
    query = db.query(category_model.Category).filter(
        or_(
            category_model.Category.user_id == user_id,
            category_model.Category.user_id == None
        )
    )
    if type_filter:
        query = query.filter(category_model.Category.type == type_filter)
    return query.order_by(category_model.Category.user_id.desc(), category_model.Category.name.asc()).all()


def get_accessible_category_for_user(db: Session, category_id, user_id, expected_type: Optional[str] = None):
    """Return a user-owned or default category only when its type matches."""
    category = (
        db.query(category_model.Category)
        .filter(category_model.Category.id == category_id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=400, detail="Category not found.")
    if expected_type is not None and category.type != expected_type:
        raise HTTPException(status_code=400, detail=f"Category type must be '{expected_type}'.")
    if category.user_id is not None and str(category.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Category is not accessible for this user.")
    return category


def update_category(db: Session, category_id: UUID, user_id: UUID, update_data: dict):
    category = (
        db.query(category_model.Category)
        .filter(category_model.Category.id == category_id, category_model.Category.user_id == user_id)
        .first()
    )
    if not category:
        return None
    for key, value in update_data.items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category_id: UUID, user_id: UUID):
    category = (
        db.query(category_model.Category)
        .filter(category_model.Category.id == category_id, category_model.Category.user_id == user_id)
        .first()
    )
    if not category:
        return None
    db.delete(category)
    db.commit()
    return category


# =========================================================
# 🧩 DEFAULT CATEGORY SEEDING (Logic được đóng gói)
# =========================================================

def seed_default_categories(db: Session):
    """
    Khởi tạo các category mặc định trong DB (chỉ chạy 1 lần).
    Danh sách hard-coded giờ đã nằm gọn trong hàm này.
    """

    # 1. Định nghĩa danh sách mặc định
    DEFAULT_CATEGORIES_DATA = {
        "income": [
            {"name": "Salary", "icon": "💵", "color": "#22C55E"},
            {"name": "Business", "icon": "💼", "color": "#F59E0B"},
            {"name": "Gift", "icon": "🎁", "color": "#10B981"},
            {"name": "Loan", "icon": "🏦", "color": "#EF4444"},
            {"name": "Insurance Payout", "icon": "🛡️", "color": "#3B82F6"},
            {"name": "Extra Income", "icon": "💸", "color": "#22C55E"},
            {"name": "Inheritance", "icon": "👨‍👩‍👧‍👦", "color": "#EC4899"},
        ],
        "expense": [
            {"name": "Health Care", "icon": "💊", "color": "#EF4444"},
            {"name": "Work", "icon": "💼", "color": "#3B82F6"},
            {"name": "Transportation", "icon": "🚌", "color": "#FACC15"},
            {"name": "Food & Drink", "icon": "🍽️", "color": "#F97316"},
            {"name": "Travel", "icon": "✈️", "color": "#EC4899"},
            {"name": "Entertainment", "icon": "🎭", "color": "#F59E0B"},
            {"name": "Education", "icon": "🎓", "color": "#3B82F6"},
            {"name": "Bills & Fees", "icon": "💰", "color": "#10B981"},
        ],
        "common": [
            {"name": "Other", "icon": "❓", "color": "#9CA3AF", "type": "income"},
            {"name": "Other", "icon": "❓", "color": "#9CA3AF", "type": "expense"},
        ]
    }

    # 2. Bắt đầu seed
    for cat_type, cats in DEFAULT_CATEGORIES_DATA.items():
        if cat_type == "common":
            # Xử lý các mục 'Other'
            for cat in cats:
                _seed_category(db, cat['name'], cat['type'], cat['icon'], cat['color'])
        else:
            # Xử lý Income/Expense
            for cat in cats:
                _seed_category(db, cat['name'], cat_type, cat['icon'], cat['color'])

    db.commit()


# Hàm helper (phụ) cho việc seed
def _seed_category(db: Session, name: str, type: str, icon: str, color: str):
    """Kiểm tra và thêm 1 category mặc định nếu chưa tồn tại."""
    existing = db.query(category_model.Category).filter(
        category_model.Category.name == name,
        category_model.Category.type == type,
        category_model.Category.user_id == None
    ).first()

    if not existing:
        new_cat = category_model.Category(
            id=uuid.uuid4(),
            user_id=None,
            name=name,
            type=type,
            icon=icon,
            color=color,
        )
        db.add(new_cat)


def get_user_category_names_string(db: Session, user_id: UUID):
    """
    Lấy danh sách tên category của user (và default) để 'mớm' cho AI.
    Trả về dạng:
    - Income: [Salary, Business, Gift...]
    - Expense: [Food & Drink, Travel, Bills...]
    """
    # Lấy tất cả category
    cats = list_all_categories_for_user(db, user_id)

    income_names = [c.name for c in cats if c.type == "income"]
    expense_names = [c.name for c in cats if c.type == "expense"]

    return f"""
    DANH MỤC HIỆN CÓ (Ưu tiên dùng chính xác tên này):
    - Thu nhập (Income): {', '.join(income_names)}
    - Chi tiêu (Expense): {', '.join(expense_names)}
    """
