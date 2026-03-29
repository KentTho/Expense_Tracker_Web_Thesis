from datetime import date, timedelta
from uuid import UUID
from decimal import Decimal
from sqlalchemy import func
from models import transaction_model, category_model, user_model
from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

def create_expense(
        db: Session,
        user_id: UUID,
        category_name: Optional[str],
        amount: Decimal,
        currency_code: Optional[str],
        date_val: date,
        emoji: Optional[str] = None,
        category_id: Optional[UUID] = None,
        note: Optional[str] = None
):
    """🟢 Tạo mới chi tiêu vào bảng Transaction và kiểm soát ngân sách"""
    # 1. Logic Category Resolution
    if category_id is None and category_name:
        existing_category = (
            db.query(category_model.Category)
            .filter(
                category_model.Category.user_id == user_id,
                category_model.Category.name == category_name,
                category_model.Category.type == "expense"
            )
            .first()
        )
        if existing_category:
            category_id = existing_category.id
        else:
            default_category = (
                db.query(category_model.Category)
                .filter(
                    category_model.Category.user_id == None,
                    category_model.Category.name == category_name,
                    category_model.Category.type == "expense"
                )
                .first()
            )
            if default_category:
                category_id = default_category.id
            else:
                new_category = category_model.Category(
                    user_id=user_id,
                    name=category_name,
                    type="expense"
                )
                db.add(new_category)
                db.flush()
                category_id = new_category.id

    # 2. Logic kiểm soát Budget (Atomic Transaction)
    if category_id is None:
        raise HTTPException(status_code=400, detail="Category ID is required.")

    user = db.query(user_model.User).filter(user_model.User.id == user_id).with_for_update().first()
    if user and user.monthly_budget is not None:
        if user.monthly_budget < amount:
            raise HTTPException(400, "Vượt ngân sách tháng")
        user.monthly_budget -= amount # Trừ ngân sách

    # 3. Tạo bản ghi Transaction (type='expense')
    transaction = transaction_model.Transaction(
        user_id=user_id,
        category_id=category_id,
        category_name=category_name,
        type="expense",
        amount=amount,
        currency_code=currency_code or "USD",
        date=date_val,
        emoji=emoji,
        note=note
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

def list_expenses_for_user(db: Session, user_id: UUID):
    """💸 Danh sách chi tiêu từ bảng Transaction"""
    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    expenses = (
        db.query(transaction_model.Transaction)
        .options(joinedload(transaction_model.Transaction.category))
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense"
        )
        .order_by(transaction_model.Transaction.date.desc())
        .all()
    )

    return {
        "items": expenses,
        "currency_code": getattr(user, 'currency_code', 'USD'),
        "currency_symbol": getattr(user, 'currency_symbol', '$'),
    }

def update_expense(db: Session, expense_id: UUID, user_id: UUID, update_data: dict):
    """✏️ Cập nhật chi tiêu trong bảng Transaction"""
    expense = (
        db.query(transaction_model.Transaction)
        .filter(
            transaction_model.Transaction.id == expense_id,
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense"
        )
        .first()
    )
    if not expense:
        return None

    for key, value in update_data.items():
        if hasattr(expense, key):
            setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense

def delete_expense(db: Session, expense_id: UUID, user_id: UUID):
    """🗑️ Xóa chi tiêu từ bảng Transaction"""
    expense = (
        db.query(transaction_model.Transaction)
        .filter(
            transaction_model.Transaction.id == expense_id, 
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense"
        )
        .first()
    )
    if not expense:
        return None

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}

def get_expense_summary(db: Session, user_id: UUID):
    """📊 Tổng chi tiêu theo danh mục"""
    summary = (
        db.query(
            transaction_model.Transaction.category_name.label("category_name"),
            func.sum(transaction_model.Transaction.amount).label("total_amount")
        )
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense"
        )
        .group_by(transaction_model.Transaction.category_name)
        .order_by(func.sum(transaction_model.Transaction.amount).desc())
        .all()
    )
    return [{"category_name": s.category_name, "total_amount": float(s.total_amount)} for s in summary]

def get_expense_daily_trend(db: Session, user_id: UUID, days: int = 30):
    """📊 Xu hướng chi tiêu theo ngày"""
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    trend_data = (
        db.query(
            transaction_model.Transaction.date.label("date"),
            func.sum(transaction_model.Transaction.amount).label("total_amount")
        )
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense",
            transaction_model.Transaction.date >= start_date,
            transaction_model.Transaction.date <= end_date
        )
        .group_by(transaction_model.Transaction.date)
        .order_by(transaction_model.Transaction.date)
        .all()
    )
    return trend_data
