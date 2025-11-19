# cruds/crud_admin.py (Đã sắp xếp và cập nhật)

import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, exc
from models import user_model, income_model, expense_model, category_model
from schemas import category_schemas  # Import schema category
from schemas.admin_schemas import AdminUserUpdate
from uuid import UUID
from decimal import Decimal
from datetime import datetime, timedelta

# Import Firebase
from firebase_admin import auth as fb_auth
from firebase_admin.auth import UserNotFoundError


# =========================================================
# 1. ADMIN STATS (Thống kê)
# =========================================================

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


# =========================================================
# 2. USER MANAGEMENT (Quản lý Người dùng)
# =========================================================

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


# cruds/crud_admin.py (Cập nhật hàm delete)

# ... (các imports giữ nguyên)

def admin_delete_user(db: Session, user: user_model.User):
    """
    Admin xóa user.
    Thứ tự: Xóa Firebase trước -> Xóa DB sau (để đảm bảo sạch sẽ).
    """
    firebase_uid = user.firebase_uid
    user_email = user.email

    print(f"🗑️ ADMIN: Attempting to delete user {user_email} ({firebase_uid})...")

    try:
        # 1. Cố gắng xóa user khỏi Firebase trước
        if firebase_uid:
            try:
                fb_auth.delete_user(firebase_uid)
                print(f"✅ Firebase user {firebase_uid} deleted.")
            except UserNotFoundError:
                print(f"⚠️ Firebase user {firebase_uid} not found (already deleted?). Continuing...")
            except Exception as fb_error:
                # Nếu lỗi kết nối Firebase, in ra nhưng KHÔNG dừng lại (tùy chọn)
                # Hoặc nếu bạn muốn chặn xóa DB nếu Firebase lỗi, hãy raise fb_error
                print(f"❌ Firebase Error: {str(fb_error)}")
                # raise fb_error # Bỏ comment dòng này nếu muốn bắt buộc xóa Firebase thành công

        # 2. Xóa user khỏi CSDL
        # SQLAlchemy sẽ tự động xóa incomes/expenses nhờ cascade="all, delete-orphan" trong model
        db.delete(user)
        db.commit()
        print(f"✅ Database user {user_email} deleted successfully.")
        return True

    except Exception as e:
        db.rollback()  # Hoàn tác nếu có lỗi
        print(f"🔥 CRITICAL ERROR deleting user: {str(e)}")
        # Ném lỗi ra ngoài để route trả về 500 và chi tiết lỗi
        raise Exception(f"Database Error: {str(e)}")


# =========================================================
# 3. DEFAULT CATEGORY MANAGEMENT (Quản lý Danh mục Mặc định)
# =========================================================

def admin_get_default_categories(db: Session, type_filter: str = None):
    """Lấy danh sách các danh mục MẶC ĐỊNH (user_id IS NULL)"""
    query = db.query(category_model.Category).filter(category_model.Category.user_id == None)
    if type_filter:
        query = query.filter(category_model.Category.type == type_filter)
    return query.order_by(category_model.Category.name.asc()).all()


def admin_get_default_category_by_id(db: Session, category_id: UUID):
    """Lấy 1 danh mục MẶC ĐỊNH bằng ID"""
    return db.query(category_model.Category).filter(
        category_model.Category.id == category_id,
        category_model.Category.user_id == None
    ).first()


def admin_create_default_category(db: Session, payload: category_schemas.CategoryCreate):
    """Tạo 1 danh mục MẶC ĐỊNH mới (user_id = None)"""
    new_cat = category_model.Category(
        id=uuid.uuid4(),
        user_id=None,  # Quan trọng: user_id là None
        name=payload.name,
        type=payload.type,
        icon=payload.icon,
        color=payload.color
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat


def admin_update_default_category(db: Session, category: category_model.Category,
                                  payload: category_schemas.CategoryCreate):
    """Cập nhật 1 danh mục MẶC ĐỊNH"""
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        # Không cho phép đổi 'type' sau khi tạo
        if key != "type":
            setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category


def admin_delete_default_category(db: Session, category: category_model.Category):
    """Xóa 1 danh mục MẶC ĐỊNH"""
    # TODO: Nên thêm logic kiểm tra category này có đang được
    # tham chiếu bởi bảng income/expense không trước khi xóa.
    db.delete(category)
    db.commit()
    return True