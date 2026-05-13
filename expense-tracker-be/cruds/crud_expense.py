from datetime import date, timedelta
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from cruds.crud_category import get_accessible_category_for_user
from models import category_model, transaction_model, user_model


def _resolve_expense_category(
        db: Session,
        user_id: UUID,
        category_id: Optional[UUID] = None,
        category_name: Optional[str] = None,
):
    if category_id is not None:
        return get_accessible_category_for_user(db, category_id, user_id, "expense")

    if not category_name:
        raise HTTPException(status_code=400, detail="Category ID or category name is required.")

    existing_category = (
        db.query(category_model.Category)
        .filter(
            category_model.Category.user_id == user_id,
            category_model.Category.name == category_name,
            category_model.Category.type == "expense",
        )
        .first()
    )
    if existing_category:
        return existing_category

    default_category = (
        db.query(category_model.Category)
        .filter(
            category_model.Category.user_id == None,
            category_model.Category.name == category_name,
            category_model.Category.type == "expense",
        )
        .first()
    )
    if default_category:
        return default_category

    new_category = category_model.Category(
        user_id=user_id,
        name=category_name,
        type="expense",
    )
    db.add(new_category)
    db.flush()
    return new_category


def create_expense(
        db: Session,
        user_id: UUID,
        category_name: Optional[str],
        amount: Decimal,
        currency_code: Optional[str],
        date_val: date,
        emoji: Optional[str] = None,
        category_id: Optional[UUID] = None,
        note: Optional[str] = None,
):
    """Create a new expense transaction and apply current budget behavior."""
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0.")

    category = _resolve_expense_category(db, user_id, category_id, category_name)

    # Phase 3 budget semantic:
    # monthly_budget is a limit (hạn mức) and must NOT be decremented here.
    # remaining_budget is computed from transactions in the month (not stored by subtraction).
    # (Validation kiểu "vuot ngan sach" sẽ được thực hiện sau qua dashboard/summary tính toán.)
    # user = db.query(user_model.User).filter(user_model.User.id == user_id).with_for_update().first()

    transaction = transaction_model.Transaction(

        user_id=user_id,
        category_id=category.id,
        category_name=category.name,
        type="expense",
        amount=amount,
        currency_code=currency_code or "USD",
        date=date_val,
        emoji=emoji,
        note=note,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction



def list_expenses_for_user(db: Session, user_id: UUID):
    """List expense transactions for one user."""
    return list_expenses_for_user_filtered(db, user_id)


def list_expenses_for_user_filtered(
        db: Session,
        user_id: UUID,
        skip: int = 0,
        limit: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        category_id: Optional[UUID] = None,
):
    """List expense transactions for one user with optional filters."""
    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    query = (
        db.query(transaction_model.Transaction)
        .options(joinedload(transaction_model.Transaction.category))
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense",
        )
    )
    if start_date:
        query = query.filter(transaction_model.Transaction.date >= start_date)
    if end_date:
        query = query.filter(transaction_model.Transaction.date <= end_date)
    if category_id:
        category = get_accessible_category_for_user(db, category_id, user_id, "expense")
        query = query.filter(transaction_model.Transaction.category_id == category.id)

    query = query.order_by(transaction_model.Transaction.date.desc()).offset(skip)
    if limit is not None:
        query = query.limit(limit)

    return {
        "items": query.all(),
        "currency_code": getattr(user, "currency_code", "USD"),
        "currency_symbol": getattr(user, "currency_symbol", "$"),
    }


def update_expense(db: Session, expense_id: UUID, user_id: UUID, update_data: dict):
    """Update an expense transaction owned by the user."""
    expense = (
        db.query(transaction_model.Transaction)
        .filter(
            transaction_model.Transaction.id == expense_id,
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense",
        )
        .first()
    )
    if not expense:
        return None

    if "amount" in update_data and update_data["amount"] is not None and update_data["amount"] <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0.")


    category_id = update_data.get("category_id")
    category_name = update_data.get("category_name")
    if category_id is not None or category_name:
        category = _resolve_expense_category(
            db=db,
            user_id=user_id,
            category_id=category_id,
            category_name=category_name,
        )
        update_data["category_id"] = category.id
        update_data["category_name"] = category.name
    else:
        update_data.pop("category_id", None)

    for key, value in update_data.items():
        if hasattr(expense, key):
            setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense_id: UUID, user_id: UUID):
    """Delete an expense transaction owned by the user."""
    expense = (
        db.query(transaction_model.Transaction)
        .filter(
            transaction_model.Transaction.id == expense_id,
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense",
        )
        .first()
    )
    if not expense:
        return None

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}


def get_expense_summary(db: Session, user_id: UUID):
    """Summarize total expenses by category."""
    summary = (
        db.query(
            transaction_model.Transaction.category_name.label("category_name"),
            func.sum(transaction_model.Transaction.amount).label("total_amount"),
        )
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense",
        )
        .group_by(transaction_model.Transaction.category_name)
        .order_by(func.sum(transaction_model.Transaction.amount).desc())
        .all()
    )
    return [{"category_name": s.category_name, "total_amount": float(s.total_amount)} for s in summary]


def get_expense_daily_trend(db: Session, user_id: UUID, days: int = 30):
    """Return daily expense totals over the requested date window."""
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    return (
        db.query(
            transaction_model.Transaction.date.label("date"),
            func.sum(transaction_model.Transaction.amount).label("total_amount"),
        )
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense",
            transaction_model.Transaction.date >= start_date,
            transaction_model.Transaction.date <= end_date,
        )
        .group_by(transaction_model.Transaction.date)
        .order_by(transaction_model.Transaction.date)
        .all()
    )
