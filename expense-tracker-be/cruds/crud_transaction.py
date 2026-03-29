from typing import List
from sqlalchemy.orm import Session, joinedload
from datetime import date
from uuid import UUID
from decimal import Decimal
from models import transaction_model
from sqlalchemy import desc

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
    """Tạo giao dịch mới trực tiếp vào bảng Transaction."""
    transaction = transaction_model.Transaction(
        user_id=user_id,
        category_id=category_id,
        category_name=category_name,
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

def list_transactions_for_user(db: Session, user_id: UUID):
    """Lấy tất cả giao dịch (cả income và expense) từ 1 bảng duy nhất."""
    return (
        db.query(transaction_model.Transaction)
        .options(joinedload(transaction_model.Transaction.category))
        .filter(transaction_model.Transaction.user_id == user_id)
        .order_by(transaction_model.Transaction.date.desc())
        .all()
    )

def get_recent_transactions(db: Session, user_id: UUID, limit: int = 10):
    """Lấy giao dịch gần đây - Cực kỳ nhanh vì không dùng UNION ALL nữa."""
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
