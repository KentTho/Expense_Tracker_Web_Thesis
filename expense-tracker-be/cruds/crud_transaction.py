# crud_transaction.py
from sqlalchemy.orm import Session
from datetime import date
from uuid import UUID
from decimal import Decimal
from models import transaction_model

def create_transaction(
    db: Session,
    user_id: UUID,
    category_id: int,
    type: str,
    amount: Decimal,
    note: str = None,
    transaction_date: date = None,
):
    """Tạo giao dịch mới (Income/Expense chung)."""
    transaction = transaction_model.Transaction(
        user_id=user_id,
        category_id=category_id,
        type=type,
        amount=amount,
        note=note,
        transaction_date=transaction_date or date.today(),
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def list_transactions_for_user(db: Session, user_id: UUID):
    """Lấy danh sách tất cả giao dịch (Transaction) của người dùng."""
    return (
        db.query(transaction_model.Transaction)
        .filter(transaction_model.Transaction.user_id == user_id)
        .order_by(transaction_model.Transaction.transaction_date.desc())
        .all()
    )


def update_transaction(db: Session, transaction_id: UUID, user_id: UUID, update_data: dict):
    """Cập nhật thông tin giao dịch."""
    transaction = (
        db.query(transaction_model.Transaction)
        .filter(transaction_model.Transaction.id == transaction_id, transaction_model.Transaction.user_id == user_id)
        .first()
    )
    if not transaction:
        return None
    for key, value in update_data.items():
        setattr(transaction, key, value)
    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(db: Session, transaction_id: int, user_id: UUID):
    """Xóa giao dịch."""
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


def get_recent_transactions(db: Session, user_id: UUID, limit: int = 10):
    """Lấy danh sách các giao dịch gần đây từ bảng Transaction."""
    recent = (
        db.query(transaction_model.Transaction)
        .filter(transaction_model.Transaction.user_id == user_id)
        .order_by(transaction_model.Transaction.transaction_date.desc())
        .limit(limit)
        .all()
    )
    return recent