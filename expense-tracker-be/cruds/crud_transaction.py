# crud_transaction.py
from typing import List

from sqlalchemy.orm import Session, joinedload
from datetime import date
from uuid import UUID
from decimal import Decimal
from models import transaction_model, category_model
# ✅ Import các model Income và Expense
from models import income_model, expense_model
# ✅ Import schema để Pydantic tự đối chiếu
from schemas.transaction_schemas import RecentTransactionOut
from sqlalchemy import func, desc, literal
from uuid import UUID # ✅ Thêm UUID
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

# ⬇️⬇️ THAY THẾ TOÀN BỘ HÀM NÀY ⬇️⬇️

def get_recent_transactions(db: Session, user_id: UUID, limit: int = 10) -> List[RecentTransactionOut]:
    """
    Lấy các giao dịch gần đây bằng cách gộp (UNION)
    từ bảng Income và Expense (ĐÃ SỬA LỖI literal).
    """

    # 1. Truy vấn bảng Income
    recent_incomes = (
        db.query(
            income_model.Income.id,
            literal("income").label("type"),  # <--- SỬA 2 (Bỏ func.)
            income_model.Income.emoji,
            income_model.Income.amount,
            income_model.Income.date.label("transaction_date"),
            income_model.Income.category_name,
            income_model.Income.note
        )
        .filter(income_model.Income.user_id == user_id)
    )

    # 2. Truy vấn bảng Expense
    recent_expenses = (
        db.query(
            expense_model.Expense.id,
            literal("expense").label("type"),  # <--- SỬA 3 (Bỏ func.)
            expense_model.Expense.emoji,
            expense_model.Expense.amount,
            expense_model.Expense.date.label("transaction_date"),
            expense_model.Expense.category_name,
            expense_model.Expense.note
        )
        .filter(expense_model.Expense.user_id == user_id)
    )

    # 3. Gộp 2 truy vấn
    recent_transactions_query = recent_incomes.union_all(recent_expenses)

    # 4. Sắp xếp và giới hạn (Giữ nguyên)
    recent_transactions = (
        recent_transactions_query
        .order_by(desc("transaction_date"))
        .limit(limit)
        .all()
    )

    # 5. Trả về list
    return recent_transactions