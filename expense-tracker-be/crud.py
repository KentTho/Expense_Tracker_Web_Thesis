# crud.py
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from decimal import Decimal
from sqlalchemy import func
from sqlalchemy.orm import Session
import models

def get_user_by_firebase_uid(db: Session, firebase_uid: str):
    return db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, firebase_uid: str = None, email: str = None, name: str = None, profile_image: str = None, password: str = None):
    user = models.User(firebase_uid=firebase_uid, email=email, name=name, profile_image=profile_image, password=password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# =========================================================
# 💰 INCOME CRUD OPERATIONS
# =========================================================

def create_income(
    db: Session,
    user_id: UUID,
    source: str,
    amount: Decimal,
    date_val: date,
    emoji: str = None,
    category_id: int = None
):
    """🟢 Tạo mới thu nhập (Income)"""
    inc = models.Income(
        user_id=user_id,
        source=source,
        amount=amount,
        date=date_val,
        emoji=emoji,
        category_id=category_id
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return inc


def list_incomes_for_user(db: Session, user_id: UUID):
    """📄 Lấy danh sách thu nhập của người dùng (có join Category)"""
    return (
        db.query(models.Income)
        .filter(models.Income.user_id == user_id)
        .order_by(models.Income.date.desc())
        .all()
    )


def update_income(db: Session, income_id: UUID, user_id: UUID, update_data: dict):
    """✏️ Cập nhật thông tin thu nhập"""
    income = (
        db.query(models.Income)
        .filter(models.Income.id == income_id, models.Income.user_id == user_id)
        .first()
    )
    if not income:
        return None

    for key, value in update_data.items():
        setattr(income, key, value)
    db.commit()
    db.refresh(income)
    return income


def delete_income(db: Session, income_id: UUID, user_id: UUID):
    """🗑️ Xóa thu nhập"""
    income = (
        db.query(models.Income)
        .filter(models.Income.id == income_id, models.Income.user_id == user_id)
        .first()
    )
    if not income:
        return None
    db.delete(income)
    db.commit()
    return income


def get_income_summary(db: Session, user_id: UUID):
    """📊 Tính tổng thu nhập của người dùng"""
    total = (
        db.query(func.sum(models.Income.amount))
        .filter(models.Income.user_id == user_id)
        .scalar()
        or 0
    )
    return float(total)


# =========================================================
# 💸 EXPENSE CRUD OPERATIONS
# =========================================================

def create_expense(
    db: Session,
    user_id: UUID,
    amount: Decimal,
    date_val: date,
    emoji: str = None,
    category_id: int = None,
    category_name: str = None
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
    """📄 Lấy danh sách chi tiêu (có join Category)"""
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
    """📊 Tính tổng chi tiêu của người dùng"""
    total = (
        db.query(func.sum(models.Expense.amount))
        .filter(models.Expense.user_id == user_id)
        .scalar()
        or 0
    )
    return float(total)


# =========================================================
# 🗂️ CATEGORY CRUD OPERATIONS
# =========================================================

def create_category(db: Session, user_id: UUID, name: str, type: str, icon: str = None, color: str = None):
    """🟢 Tạo mới danh mục thu/chi"""
    category = models.Category(
        user_id=user_id,
        name=name,
        type=type,
        icon=icon,
        color=color
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def list_categories_for_user(db: Session, user_id: UUID, type_filter: str = None):
    """📄 Lấy danh sách danh mục (có thể lọc theo loại)"""
    query = db.query(models.Category).filter(models.Category.user_id == user_id)
    if type_filter:
        query = query.filter(models.Category.type == type_filter)
    return query.order_by(models.Category.created_at.desc()).all()


def delete_category(db: Session, category_id: int, user_id: UUID):
    """🗑️ Xóa danh mục"""
    category = (
        db.query(models.Category)
        .filter(models.Category.id == category_id, models.Category.user_id == user_id)
        .first()
    )
    if not category:
        return None
    db.delete(category)
    db.commit()
    return category

# ---- CATEGORY ----
def create_category(db: Session, user_id: UUID, name: str, type: str, color_code: str = None, icon_name: str = None):
    category = models.Category(
        user_id=user_id,
        name=name,
        type=type,
        color_code=color_code,
        icon_name=icon_name,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def list_categories_for_user(db: Session, user_id: UUID):
    return (
        db.query(models.Category)
        .filter(models.Category.user_id == user_id)
        .order_by(models.Category.created_at.desc())
        .all()
    )


def update_category(db: Session, category_id: int, user_id: UUID, update_data: dict):
    category = (
        db.query(models.Category)
        .filter(models.Category.category_id == category_id, models.Category.user_id == user_id)
        .first()
    )
    if not category:
        return None
    for key, value in update_data.items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category_id: int, user_id: UUID):
    category = (
        db.query(models.Category)
        .filter(models.Category.category_id == category_id, models.Category.user_id == user_id)
        .first()
    )
    if not category:
        return None
    db.delete(category)
    db.commit()
    return category


# ---- TRANSACTION ----
def create_transaction(
    db: Session,
    user_id: UUID,
    category_id: int,
    type: str,
    amount: Decimal,
    note: str = None,
    transaction_date: date = None,
):
    transaction = models.Transaction(
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
    return (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == user_id)
        .order_by(models.Transaction.transaction_date.desc())
        .all()
    )


def update_transaction(db: Session, transaction_id: int, user_id: UUID, update_data: dict):
    transaction = (
        db.query(models.Transaction)
        .filter(models.Transaction.transaction_id == transaction_id, models.Transaction.user_id == user_id)
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
    transaction = (
        db.query(models.Transaction)
        .filter(models.Transaction.transaction_id == transaction_id, models.Transaction.user_id == user_id)
        .first()
    )
    if not transaction:
        return None
    db.delete(transaction)
    db.commit()
    return transaction


def get_financial_summary(db: Session, user_id: UUID):
    total_income = (
        db.query(func.sum(models.Transaction.amount))
        .filter(models.Transaction.user_id == user_id, models.Transaction.type == "income")
        .scalar()
        or 0
    )
    total_expense = (
        db.query(func.sum(models.Transaction.amount))
        .filter(models.Transaction.user_id == user_id, models.Transaction.type == "expense")
        .scalar()
        or 0
    )
    balance = float(total_income) - float(total_expense)
    return {
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "balance": balance
    }


def get_expense_by_category(db: Session, user_id: UUID):
    result = (
        db.query(
            models.Category.name,
            func.sum(models.Transaction.amount).label("total_amount")
        )
        .join(models.Transaction, models.Transaction.category_id == models.Category.category_id)
        .filter(models.Transaction.user_id == user_id, models.Transaction.type == "expense")
        .group_by(models.Category.name)
        .all()
    )
    return [{"category": r[0], "total": float(r[1])} for r in result]
