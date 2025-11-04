from sqlalchemy.orm import Session
from datetime import date
from uuid import UUID
from decimal import Decimal
from typing import Optional  # ✅ Cần import Optional
from sqlalchemy import func
import models
from fastapi import HTTPException  # ✅ Cần import HTTPException
from sqlalchemy.orm import Session, joinedload

def create_income(
        db: Session,
        user_id: UUID,
        category_name: Optional[str],  # ✅ Sửa: Cho phép None
        amount: Decimal,
        date_val: date,
        emoji: Optional[str] = None,
        category_id: Optional[UUID] = None
):
    """🧾 Tạo thu nhập mới, tự động tạo Category nếu chưa có"""

    # ✅ Logic Category ID Resolution
    if category_id is None and category_name:
        # 1. Thử tìm Category của User
        existing_category = (
            db.query(models.Category)
            .filter(
                models.Category.user_id == user_id,
                models.Category.name == category_name,
                models.Category.type == "income"
            )
            .first()
        )

        if existing_category:
            category_id = existing_category.id
        else:
            # 2. Thử tìm Category Mặc Định (user_id=None)
            default_category = (
                db.query(models.Category)
                .filter(
                    models.Category.user_id == None,
                    models.Category.name == category_name,
                    models.Category.type == "income"
                )
                .first()
            )

            if default_category:
                category_id = default_category.id
            else:
                # 3. Nếu không có user-defined hoặc default -> Tạo category mới (user-defined)
                new_category = models.Category(
                    user_id=user_id,
                    name=category_name,
                    type="income",
                    color="#4CAF50",
                    icon=emoji or "💰"
                )
                db.add(new_category)
                db.commit()
                db.refresh(new_category)
                category_id = new_category.id

    # 🛑 Kiểm tra bắt buộc: Đảm bảo có Category ID trước khi tạo Income
    if category_id is None:
        raise HTTPException(status_code=400, detail="Category ID is required or category name is invalid.")

    # 🔹 Tạo income record
    inc = models.Income(
        user_id=user_id,
        category_name=category_name,  # Đã cho phép None
        amount=amount,
        date=date_val,
        emoji=emoji,
        category_id=category_id
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return inc


def list_incomes_for_user(db: Session, user_id: UUID):
    """🧾 Danh sách thu nhập của người dùng, tải kèm thông tin Category."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ BỔ SUNG joinedload VÀ SẮP XẾP
    incomes = (
        db.query(models.Income)
        .options(joinedload(models.Income.category)) # ⬅️ Tải Category
        .filter(models.Income.user_id == user_id)
        .order_by(models.Income.date.desc())
        .all()
    )

    return {
        "items": incomes,
        "currency_code": getattr(user, 'currency_code', 'USD'),
        "currency_symbol": getattr(user, 'currency_symbol', '$'),
    }


def update_income(db: Session, income_id: UUID, user_id: UUID, update_data: dict):
    """✏️ Cập nhật thông tin thu nhập"""
    income = (
        db.query(models.Income)
        .filter(models.Income.id == income_id, models.Income.user_id == user_id)
        .first()
    )
    if not income:
        return None

    for key, value in update_data.items():
        setattr(income, key, value)
    db.commit()
    db.refresh(income)
    return income


def delete_income(db: Session, income_id: UUID, user_id: UUID):
    """🗑️ Xóa thu nhập"""
    income = (
        db.query(models.Income)
        .filter(models.Income.id == income_id, models.Income.user_id == user_id)
        .first()
    )
    if not income:
        return None
    db.delete(income)
    db.commit()
    return income


def get_income_summary(db: Session, user_id: UUID):
    """📊 Lấy tổng chi tiêu theo danh mục"""
    summary = (
        db.query(
            models.Income.category_name.label("category_name"),
            func.sum(models.Income.amount).label("total_amount")
        )
        .filter(models.Income.user_id == user_id)
        .group_by(models.Income.category_name)
        .order_by(func.sum(models.Income.amount).desc())
        .all()
    )

    # Chuyển đổi Decimal sang float để JSON serialization
    return [
        {
            "category_name": s.category_name,
            "total_amount": float(s.total_amount)
        }
        for s in summary
    ]