from datetime import date, timedelta
from uuid import UUID
from decimal import Decimal
from sqlalchemy import func
from models import user_model, category_model, expense_model
from typing import Optional
from fastapi import HTTPException  # Cần thiết cho các hàm khác
from sqlalchemy.orm import Session, joinedload

def create_expense(
        db: Session,
        user_id: UUID,
        category_name: Optional[str],
        amount: Decimal,
        currency_code:Optional[str],
        date_val: date,
        emoji: Optional[str] = None,
        category_id: Optional[UUID] = None
):
    """🟢 Tạo mới chi tiêu (Expense), tự động tạo Category nếu chưa có"""

    # ✅ Logic Category ID Resolution (ĐÃ THÊM)
    if category_id is None and category_name:
        # 1. Thử tìm Category của User
        existing_category = (
            db.query(category_model.Category)
            .filter(
                category_model.Category.user_id == user_id,
                category_model.Category.name == category_name,
                category_model.Category.type == "expense"  # 👈 SỬ DỤNG TYPE "expense"
            )
            .first()
        )

        if existing_category:
            category_id = existing_category.id
        else:
            # 2. Thử tìm Category Mặc Định (user_id=None)
            default_category = (
                db.query(category_model.Category)
                .filter(
                    category_model.Category.user_id == None,
                    category_model.Category.name == category_name,
                    category_model.Category.type == "expense"  # 👈 SỬ DỤNG TYPE "expense"
                )
                .first()
            )

            if default_category:
                category_id = default_category.id
            else:
                # 3. Tạo Category mới cho User (Nếu không tìm thấy)
                new_category = category_model.Category(
                    user_id=user_id,
                    name=category_name,
                    type="expense",  # 👈 SỬ DỤNG TYPE "expense"
                )
                db.add(new_category)
                db.flush()
                category_id = new_category.id

    # Tạo bản ghi Expense
    exp = expense_model.Expense(
        user_id=user_id,
        category_id=category_id,
        category_name=category_name,
        amount=amount,
        currency_code=currency_code,  # 💡 LƯU VÀO DB
        date=date_val,
        emoji=emoji
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


def list_expenses_for_user(db: Session, user_id: UUID):
    """💸 Lấy danh sách chi tiêu của người dùng, tải kèm thông tin Category."""

    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ ĐÃ SỬA: SỬ DỤNG joinedload ĐỂ TẢI MỐI QUAN HỆ Category
    expenses = (
        db.query(expense_model.Expense)
        .options(joinedload(expense_model.Expense.category)) # ⬅️ QUAN TRỌNG: Tải Category
        .filter(expense_model.Expense.user_id == user_id)
        .order_by(expense_model.Expense.date.desc()) # Thêm sắp xếp cho gọn
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
        db.query(expense_model.Expense)
        .filter(expense_model.Expense.id == expense_id, expense_model.Expense.user_id == user_id)
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
        db.query(expense_model.Expense)
        .filter(expense_model.Expense.id == expense_id, expense_model.Expense.user_id == user_id)
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
            expense_model.Expense.category_name.label("category_name"),
            func.sum(expense_model.Expense.amount).label("total_amount")
        )
        .filter(expense_model.Expense.user_id == user_id)
        .group_by(expense_model.Expense.category_name)
        .order_by(func.sum(expense_model.Expense.amount).desc())
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


def get_expense_daily_trend(db: Session, user_id: UUID, days: int = 30):
    """📊 Lấy tổng chi tiêu theo ngày trong N ngày qua (cho Bar Chart)"""

    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)  # Lấy N ngày, tính cả ngày hôm nay

    trend_data = (
        db.query(
            expense_model.Expense.date.label("date"),
            func.sum(expense_model.Expense.amount).label("total_amount")
        )
        .filter(
            expense_model.Expense.user_id == user_id,
            expense_model.Expense.date >= start_date,
            expense_model.Expense.date <= end_date
        )
        .group_by(expense_model.Expense.date)
        .order_by(expense_model.Expense.date)
        .all()
    )
    # Kết quả trả về là list of Row objects, phù hợp với Pydantic (ExpenseTrendOut)
    return trend_data