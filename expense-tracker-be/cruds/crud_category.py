from sqlalchemy import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_  # Cần import 'or_' để dùng cho filter
import models
import uuid


# =========================================================
# 🗂️ CATEGORY CRUD OPERATIONS
# =========================================================

def create_category(db: Session, user_id: UUID, name: str, type: str, color: str = None, icon: str = None):
    category = models.Category(
        id=uuid.uuid4(),  # ✅ tự tạo ID nếu model chưa sinh tự động
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


def list_categories_for_user(db: Session, user_id: UUID, type_filter: str = None):
    query = db.query(models.Category).filter(models.Category.user_id == user_id)
    if type_filter:
        query = query.filter(models.Category.type == type_filter)
    return query.order_by(models.Category.created_at.desc()).all()


# ✅ HÀM MỚI: Lấy cả User-defined và Default Categories từ DB
def list_all_categories_for_user(db: Session, user_id: UUID, type_filter: str = None):
    """
    Lấy danh sách Categories bao gồm:
    1. Categories do người dùng tạo (user_id == user_id)
    2. Default Categories (user_id == None)
    """
    query = db.query(models.Category).filter(
        or_(
            models.Category.user_id == user_id,
            models.Category.user_id == None
        )
    )
    if type_filter:
        query = query.filter(models.Category.type == type_filter)

    # Sắp xếp: User categories lên trên, Default categories xuống dưới (hoặc theo tên)
    return query.order_by(models.Category.user_id.desc(), models.Category.name.asc()).all()


def update_category(db: Session, category_id: UUID, user_id: UUID, update_data: dict):
    category = (
        db.query(models.Category)
        .filter(models.Category.id == category_id, models.Category.user_id == user_id)
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
        db.query(models.Category)
        .filter(models.Category.id == category_id, models.Category.user_id == user_id)
        .first()
    )
    if not category:
        return None
    db.delete(category)
    db.commit()
    return category


# =========================================================
# 🧩 DEFAULT CATEGORY SEEDING
# =========================================================

# Hàm get_default_categories và seed_default_categories giữ nguyên logic
# (get_default_categories vẫn dùng data cứng, seed_default_categories dùng data cứng để seed vào DB)

def get_default_categories(type: str):
    """Danh mục mặc định (income / expense)"""
    if type == "income":
        return [
            {"id": str(uuid.uuid4()), "name": "Salary", "icon_name": "💵", "color_code": "#22C55E"},
            {"id": str(uuid.uuid4()), "name": "Business", "icon_name": "💼", "color_code": "#F59E0B"},
            {"id": str(uuid.uuid4()), "name": "Gift", "icon_name": "🎁", "color_code": "#10B981"},
            {"id": str(uuid.uuid4()), "name": "Loan", "icon_name": "🏦", "color_code": "#EF4444"},
            {"id": str(uuid.uuid4()), "name": "Insurance Payout", "icon_name": "🛡️", "color_code": "#3B82F6"},
            {"id": str(uuid.uuid4()), "name": "Extra Income", "icon_name": "💸", "color_code": "#22C55E"},
            {"id": str(uuid.uuid4()), "name": "Inheritance", "icon_name": "👨‍👩‍👧‍👦", "color_code": "#EC4899"},
            {"id": str(uuid.uuid4()), "name": "Other", "icon_name": "❓", "color_code": "#9CA3AF"},
        ]
    elif type == "expense":
        return [
            {"id": str(uuid.uuid4()), "name": "Health Care", "icon_name": "💊", "color_code": "#EF4444"},
            {"id": str(uuid.uuid4()), "name": "Work", "icon_name": "💼", "color_code": "#3B82F6"},
            {"id": str(uuid.uuid4()), "name": "Transportation", "icon_name": "🚌", "color_code": "#FACC15"},
            {"id": str(uuid.uuid4()), "name": "Food & Drink", "icon_name": "🍽️", "color_code": "#F97316"},
            {"id": str(uuid.uuid4()), "name": "Travel", "icon_name": "✈️", "color_code": "#EC4899"},
            {"id": str(uuid.uuid4()), "name": "Entertainment", "icon_name": "🎭", "color_code": "#F59E0B"},
            {"id": str(uuid.uuid4()), "name": "Education", "icon_name": "🎓", "color_code": "#3B82F6"},
            {"id": str(uuid.uuid4()), "name": "Bills & Fees", "icon_name": "💰", "color_code": "#10B981"},
            {"id": str(uuid.uuid4()), "name": "Other", "icon_name": "❓", "color_code": "#9CA3AF"},
        ]
    else:
        return []


def seed_default_categories(db: Session):
    """Khởi tạo các category mặc định trong DB (chỉ chạy 1 lần)"""
    for cat_type in ["income", "expense"]:
        defaults = get_default_categories(cat_type)
        for cat in defaults:
            existing = db.query(models.Category).filter(
                models.Category.name == cat["name"],
                models.Category.type == cat_type,
                models.Category.user_id == None  # Mặc định (không gắn user)
            ).first()

            if not existing:
                new_cat = models.Category(
                    id=uuid.uuid4(),  # ✅ tạo UUID thật
                    user_id=None,  # category mặc định dùng chung
                    name=cat["name"],
                    type=cat_type,
                    icon=cat["icon_name"],
                    color=cat["color_code"],
                )
                db.add(new_cat)
    db.commit()