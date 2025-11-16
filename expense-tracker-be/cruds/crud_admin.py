# cruds/crud_admin.py (TẠO FILE MỚI)
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import func, desc, exc
from models import user_model, income_model, expense_model, category_model
from schemas import category_schemas
from schemas.admin_schemas import AdminUserUpdate
from uuid import UUID
from decimal import Decimal
from datetime import datetime, timedelta

# --- Default Category Management (HÀM MỚI) ---

def admin_get_default_categories(db: Session, type_filter: str = None):
    query = db.query(category_model.Category).filter(category_model.Category.user_id == None)
    if type_filter:
        query = query.filter(category_model.Category.type == type_filter)
    return query.order_by(category_model.Category.name.asc()).all()

def admin_get_default_category_by_id(db: Session, category_id: UUID):
    return db.query(category_model.Category).filter(
        category_model.Category.id == category_id,
        category_model.Category.user_id == None
    ).first()

def admin_create_default_category(db: Session, payload: category_schemas.CategoryCreate):
    new_cat = category_model.Category(
        id=uuid.uuid4(),
        user_id=None, # Quan trọng: user_id là None
        name=payload.name,
        type=payload.type,
        icon=payload.icon,
        color=payload.color
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

def admin_update_default_category(db: Session, category: category_model.Category, payload: category_schemas.CategoryCreate):
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        # Không cho phép đổi 'type' sau khi tạo
        if key != "type":
            setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category

def admin_delete_default_category(db: Session, category: category_model.Category):
    db.delete(category)
    db.commit()
    return True

# --- User Management ---

def admin_get_all_users(db: Session, skip: int = 0, limit: int = 100):
    """Lấy danh sách tất cả người dùng (có phân trang)"""
    return db.query(user_model.User).order_by(user_model.User.created_at.desc()).offset(skip).limit(limit).all()


def admin_get_user_by_id(db: Session, user_id: UUID):
    """Lấy 1 user bằng ID"""
    return db.query(user_model.User).filter(user_model.User.id == user_id).first()


def admin_update_user(db: Session, user: user_model.User, update_data: AdminUserUpdate):
    """Admin cập nhật thông tin user"""
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


def admin_delete_user(db: Session, user: user_model.User):
    """Admin xóa user (cascade sẽ xóa incomes, expenses, categories)"""
    db.delete(user)
    db.commit()
    return True


# --- Default Category Management ---
# (Logic tương tự crud_category, nhưng user_id = None)

def admin_get_default_categories(db: Session, type_filter: str = None):
    """Lấy danh sách các danh mục MẶC ĐỊNH (user_id IS NULL)"""
    query = db.query(category_model.Category).filter(category_model.Category.user_id == None)
    if type_filter:
        query = query.filter(category_model.Category.type == type_filter)
    return query.order_by(category_model.Category.name.asc()).all()


# (Bạn có thể thêm admin_create_default_category, admin_update_default_category sau)

# --- Admin Stats ---

def admin_get_global_kpis(db: Session):
    """Lấy KPI thống kê toàn hệ thống"""
    total_users = db.query(func.count(user_model.User.id)).scalar()
    total_income = db.query(func.sum(income_model.Income.amount)).scalar() or Decimal(0)
    total_expense = db.query(func.sum(expense_model.Expense.amount)).scalar() or Decimal(0)

    return {
        "total_users": total_users,
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "net_balance": float(total_income - total_expense)
    }


def admin_get_user_growth(db: Session, days: int = 30):
    """Lấy số lượng user mới mỗi ngày trong N ngày qua"""
    start_date = datetime.utcnow().date() - timedelta(days=days - 1)

    growth_data = (
        db.query(
            func.date(user_model.User.created_at).label("date"),
            func.count(user_model.User.id).label("count")
        )
        .filter(user_model.User.created_at >= start_date)
        .group_by(func.date(user_model.User.created_at))
        .order_by(func.date(user_model.User.created_at).asc())
        .all()
    )

    # Format data
    return [{"date": str(row.date), "count": row.count} for row in growth_data]