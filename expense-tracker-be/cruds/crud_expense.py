# crud_expense.py
from sqlalchemy.orm import Session
from datetime import date
from uuid import UUID
from decimal import Decimal
from sqlalchemy import func
import models
from typing import Optional

def create_expense(
    db: Session,
    user_id: UUID,
    category_name: Optional[str],
    amount: Decimal,
    date_val: date,
    emoji: Optional[str] = None,
    category_id: Optional[UUID] = None
):
    """🟢 Tạo mới chi tiêu (Expense)"""
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
    """📄 Lấy danh sách chi tiêu"""
    return (
        db.query(models.Expense)
        .filter(models.Expense.user_id == user_id)
        .order_by(models.Expense.date.desc())
        .all()
    )


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
    return expense


def get_expense_summary(db: Session, user_id: UUID):
    """📊 Tính tổng chi tiêu của người dùng (từ bảng Expense)"""
    # Phiên bản tối ưu:
    return db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(models.Expense.user_id == user_id).scalar()