from datetime import date
from uuid import UUID
from decimal import Decimal
from typing import Optional
from sqlalchemy import func
from models import transaction_model, category_model, user_model
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

def create_income(
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
    """🧾 Tạo thu nhập mới vào bảng Transaction"""
    # Logic Category Resolution
    if category_id is None and category_name:
        existing_category = (
            db.query(category_model.Category)
            .filter(
                category_model.Category.user_id == user_id,
                category_model.Category.name == category_name,
                category_model.Category.type == "income"
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
                    category_model.Category.type == "income"
                )
                .first()
            )
            if default_category:
                category_id = default_category.id
            else:
                new_category = category_model.Category(
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

    if category_id is None:
        raise HTTPException(status_code=400, detail="Category ID is required.")

    # Tạo record trong bảng Transaction
    transaction = transaction_model.Transaction(
        user_id=user_id,
        category_id=category_id,
        category_name=category_name,
        type="income", # 👈 Cố định type là income
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

def list_incomes_for_user(db: Session, user_id: UUID):
    """🧾 Danh sách thu nhập từ bảng Transaction"""
    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    incomes = (
        db.query(transaction_model.Transaction)
        .options(joinedload(transaction_model.Transaction.category))
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "income" # 👈 Lọc type
        )
        .order_by(transaction_model.Transaction.date.desc())
        .all()
    )

    return {
        "items": incomes,
        "currency_code": getattr(user, 'currency_code', 'USD'),
        "currency_symbol": getattr(user, 'currency_symbol', '$'),
    }

def update_income(db: Session, income_id: UUID, user_id: UUID, update_data: dict):
    """✏️ Cập nhật thu nhập trong bảng Transaction"""
    income = (
        db.query(transaction_model.Transaction)
        .filter(
            transaction_model.Transaction.id == income_id,
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "income"
        )
        .first()
    )
    if not income:
        return None

    for key, value in update_data.items():
        if hasattr(income, key):
            setattr(income, key, value)
    db.commit()
    db.refresh(income)
    return income

def delete_income(db: Session, income_id: UUID, user_id: UUID):
    """🗑️ Xóa thu nhập từ bảng Transaction"""
    income = (
        db.query(transaction_model.Transaction)
        .filter(
            transaction_model.Transaction.id == income_id, 
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "income"
        )
        .first()
    )
    if not income:
        return None
    db.delete(income)
    db.commit()
    return income

def get_income_summary(db: Session, user_id: UUID):
    """📊 Tổng thu nhập theo danh mục"""
    summary = (
        db.query(
            transaction_model.Transaction.category_name.label("category_name"),
            func.sum(transaction_model.Transaction.amount).label("total_amount")
        )
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "income"
        )
        .group_by(transaction_model.Transaction.category_name)
        .order_by(func.sum(transaction_model.Transaction.amount).desc())
        .all()
    )
    return [{"category_name": s.category_name, "total_amount": float(s.total_amount)} for s in summary]
