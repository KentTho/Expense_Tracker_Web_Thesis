from sqlalchemy.orm import Session
from datetime import date
from uuid import UUID
from decimal import Decimal
from sqlalchemy import func
import models
from typing import Optional
from fastapi import HTTPException  # Cần thiết cho các hàm khác
from sqlalchemy.orm import Session, joinedload

def create_expense(
        db: Session,
        user_id: UUID,
        category_name: Optional[str],
        amount: Decimal,
        date_val: date,
        emoji: Optional[str] = None,
        category_id: Optional[UUID] = None
):
    """🟢 Tạo mới chi tiêu (Expense), tự động tạo Category nếu chưa có"""

    # ✅ Logic Category ID Resolution (ĐÃ THÊM)
    if category_id is None and category_name:
        # 1. Thử tìm Category của User
        existing_category = (
            db.query(models.Category)
            .filter(
                models.Category.user_id == user_id,
                models.Category.name == category_name,
                models.Category.type == "expense"  # 👈 SỬ DỤNG TYPE "expense"
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
                    models.Category.type == "expense"  # 👈 SỬ DỤNG TYPE "expense"
                )
                .first()
            )

            if default_category:
                category_id = default_category.id
            else:
                # 3. Tạo Category mới cho User (Nếu không tìm thấy)
                new_category = models.Category(
                    user_id=user_id,
                    name=category_name,
                    type="expense",  # 👈 SỬ DỤNG TYPE "expense"
                )
                db.add(new_category)
                db.flush()
                category_id = new_category.id

    # Tạo bản ghi Expense
    exp = models.Expense(
        user_id=user_id,
        category_id=category_id,
        category_name=category_name,
        amount=amount,
        date=date_val,
        emoji=emoji
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


def list_expenses_for_user(db: Session, user_id: UUID):
    """💸 Lấy danh sách chi tiêu của người dùng, tải kèm thông tin Category."""

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ ĐÃ SỬA: SỬ DỤNG joinedload ĐỂ TẢI MỐI QUAN HỆ Category
    expenses = (
        db.query(models.Expense)
        .options(joinedload(models.Expense.category)) # ⬅️ QUAN TRỌNG: Tải Category
        .filter(models.Expense.user_id == user_id)
        .order_by(models.Expense.date.desc()) # Thêm sắp xếp cho gọn
        .all()
    )

    # TRẢ VỀ CẤU TRÚC ĐỒNG BỘ VỚI ExpenseListOut Schema (nếu có)
    # Giả định bạn có Schema ExpenseListOut chứa các trường này
    return {
        "items": expenses,
        # Nếu user chưa có trường currency_code/symbol, hãy thêm kiểm tra
        "currency_code": getattr(user, 'currency_code', 'USD'),
        "currency_symbol": getattr(user, 'currency_symbol', '$'),
    }

def update_expense(db: Session, expense_id: UUID, user_id: UUID, update_data: dict):
    """✏️ Cập nhật thông tin chi tiêu"""
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.user_id == user_id)
        .first()
    )
    if not expense:
        return None

    for key, value in update_data.items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense_id: UUID, user_id: UUID):
    """🗑️ Xóa chi tiêu"""
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.user_id == user_id)
        .first()
    )
    if not expense:
        return None

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}


def get_expense_summary(db: Session, user_id: UUID):
    """📊 Lấy tổng chi tiêu theo danh mục"""
    summary = (
        db.query(
            models.Expense.category_name.label("category_name"),
            func.sum(models.Expense.amount).label("total_amount")
        )
        .filter(models.Expense.user_id == user_id)
        .group_by(models.Expense.category_name)
        .order_by(func.sum(models.Expense.amount).desc())
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