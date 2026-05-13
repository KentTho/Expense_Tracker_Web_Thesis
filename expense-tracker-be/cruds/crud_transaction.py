from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from cruds.crud_category import get_accessible_category_for_user
from models import transaction_model


ALLOWED_TRANSACTION_TYPES = {"income", "expense"}


def _validate_transaction_type(transaction_type: str) -> None:
    if transaction_type not in ALLOWED_TRANSACTION_TYPES:
        raise HTTPException(status_code=400, detail="Transaction type must be 'income' or 'expense'.")


def create_transaction(
    db: Session,
    user_id: UUID,
    category_id: UUID,
    type: str,
    amount: Decimal,
    category_name: str = None,
    emoji: str = None,
    note: str = None,
    transaction_date: date = None,
):
    """Create a unified transaction directly."""
    _validate_transaction_type(type)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0.")

    category = get_accessible_category_for_user(db, category_id, user_id, type)
    transaction = transaction_model.Transaction(
        user_id=user_id,
        category_id=category.id,
        category_name=category_name or category.name,
        type=type,
        amount=amount,
        emoji=emoji,
        note=note,
        date=transaction_date or date.today(),
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def list_transactions_for_user(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[UUID] = None,
    type_filter: Optional[str] = None,
):
    """List all unified transactions for a user."""
    if type_filter is not None:
        _validate_transaction_type(type_filter)

    query = (
        db.query(transaction_model.Transaction)
        .options(joinedload(transaction_model.Transaction.category))
        .filter(transaction_model.Transaction.user_id == user_id)
    )
    if type_filter:
        query = query.filter(transaction_model.Transaction.type == type_filter)
    if start_date:
        query = query.filter(transaction_model.Transaction.date >= start_date)
    if end_date:
        query = query.filter(transaction_model.Transaction.date <= end_date)
    if category_id:
        category = get_accessible_category_for_user(db, category_id, user_id, type_filter)
        query = query.filter(transaction_model.Transaction.category_id == category.id)

    query = query.order_by(transaction_model.Transaction.date.desc()).offset(skip)
    if limit is not None:
        query = query.limit(limit)
    return query.all()


def get_recent_transactions(db: Session, user_id: UUID, limit: int = 10):
    """List recent transactions for a user."""
    return (
        db.query(transaction_model.Transaction)
        .filter(transaction_model.Transaction.user_id == user_id)
        .order_by(desc(transaction_model.Transaction.date))
        .limit(limit)
        .all()
    )


def update_transaction(db: Session, transaction_id: UUID, user_id: UUID, update_data: dict):
    transaction = (
        db.query(transaction_model.Transaction)
        .filter(transaction_model.Transaction.id == transaction_id, transaction_model.Transaction.user_id == user_id)
        .first()
    )
    if not transaction:
        return None

    if "amount" in update_data and update_data["amount"] is not None and update_data["amount"] <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0.")

    expected_type = update_data.get("type", transaction.type)
    _validate_transaction_type(expected_type)

    if "category_id" in update_data and update_data["category_id"] is not None:
        category = get_accessible_category_for_user(db, update_data["category_id"], user_id, expected_type)
        update_data["category_id"] = category.id
        update_data["category_name"] = update_data.get("category_name") or category.name
    else:
        update_data.pop("category_id", None)

    for key, value in update_data.items():
        if hasattr(transaction, key):
            setattr(transaction, key, value)
    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(db: Session, transaction_id: UUID, user_id: UUID):
    transaction = (
        db.query(transaction_model.Transaction)
        .filter(transaction_model.Transaction.id == transaction_id, transaction_model.Transaction.user_id == user_id)
        .first()
    )
    if not transaction:
        return None
    db.delete(transaction)
    db.commit()
    return transaction
