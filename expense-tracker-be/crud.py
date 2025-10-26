# crud.py
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from decimal import Decimal
from sqlalchemy import func, desc
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
        category_name: str,
        amount: Decimal,
        date_val: date,
        emoji: str = None,
        category_id: UUID = None
):
    inc = models.Income(
        user_id=user_id,
        category_name=category_name,  # ✅ đổi từ source → category_name
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
    category_id: UUID = None,
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
def create_category(db: Session, user_id: UUID, name: str, type: str, color: str = None, icon: str = None):
    category = models.Category(
        user_id=user_id,
        name=name,
        type=type,
        color=color,
        icon=icon,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def list_categories_for_user(db: Session, user_id: UUID, type_filter: str = None):
    query = db.query(models.Category).filter(models.Category.user_id == user_id)
    if type_filter:
        query = query.filter(models.Category.type == type_filter)
    return query.order_by(models.Category.created_at.desc()).all()


def update_category(db: Session, category_id: UUID, user_id: UUID, update_data: dict):
    category = (
        db.query(models.Category)
        .filter(models.Category.id == category_id, models.Category.user_id == user_id)
        .first()
    )
    if not category:
        return None
    for key, value in update_data.items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category_id: UUID, user_id: UUID):
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

def get_default_categories(category_type: str):
    default_data = {
        "income": [
            {"name": "Salary", "icon_name": "💵", "color_code": "#22C55E"},
            {"name": "Business", "icon_name": "💼", "color_code": "#F59E0B"},
            {"name": "Gift", "icon_name": "🎁", "color_code": "#10B981"},
            {"name": "Loan", "icon_name": "🏦", "color_code": "#EF4444"},
            {"name": "Insurance Payout", "icon_name": "🛡️", "color_code": "#3B82F6"},
            {"name": "Extra Income", "icon_name": "💸", "color_code": "#22C55E"},
            {"name": "Inheritance", "icon_name": "👨‍👩‍👧‍👦", "color_code": "#EC4899"},
            {"name": "Other", "icon_name": "❓", "color_code": "#9CA3AF"},
        ],
        "expense": [
            {"name": "Health Care", "icon_name": "💊", "color_code": "#EF4444"},
            {"name": "Work", "icon_name": "💼", "color_code": "#3B82F6"},
            {"name": "Transportation", "icon_name": "🚌", "color_code": "#FACC15"},
            {"name": "Food & Drink", "icon_name": "🍽️", "color_code": "#F97316"},
            {"name": "Travel", "icon_name": "✈️", "color_code": "#EC4899"},
            {"name": "Entertainment", "icon_name": "🎭", "color_code": "#F59E0B"},
            {"name": "Education", "icon_name": "🎓", "color_code": "#3B82F6"},
            {"name": "Bills & Fees", "icon_name": "💰", "color_code": "#10B981"},
            {"name": "Other", "icon_name": "❓", "color_code": "#9CA3AF"},
        ],
    }
    return default_data.get(category_type, [])

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


def update_transaction(db: Session, transaction_id: UUID, user_id: UUID, update_data: dict):
    transaction = (
        db.query(models.Transaction)
        .filter(models.Transaction.id == transaction_id, models.Transaction.user_id == user_id)
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
        .filter(models.Transaction.id == transaction_id, models.Transaction.user_id == user_id)
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
        .join(models.Transaction, models.Transaction.category_id == models.Category.id)
        .filter(models.Transaction.user_id == user_id, models.Transaction.type == "expense")
        .group_by(models.Category.name)
        .all()
    )
    return [{"category": r[0], "total": float(r[1])} for r in result]


def get_dashboard_data(db: Session, user_id: UUID):
    total_income = get_income_summary(db, user_id)
    total_expense = get_expense_summary(db, user_id)
    balance = total_income - total_expense

    # Giao dịch gần đây
    recent = (
        db.query(models.Income.category_name.label("name"),
                 models.Income.amount,
                 models.Income.date,
                 models.Income.emoji,
                 func.literal("income").label("type"))
        .filter(models.Income.user_id == user_id)
        .union_all(
            db.query(models.Expense.category_name.label("name"),
                     models.Expense.amount,
                     models.Expense.date,
                     models.Expense.emoji,
                     func.literal("expense").label("type"))
            .filter(models.Expense.user_id == user_id)
        )
        .order_by(desc("date"))
        .limit(10)
        .all()
    )

    # Chart dữ liệu
    income_chart = (
        db.query(models.Income.date, func.sum(models.Income.amount).label("total"))
        .filter(models.Income.user_id == user_id)
        .group_by(models.Income.date)
        .order_by(models.Income.date.desc())
        .limit(30)
        .all()
    )
    expense_chart = (
        db.query(models.Expense.date, func.sum(models.Expense.amount).label("total"))
        .filter(models.Expense.user_id == user_id)
        .group_by(models.Expense.date)
        .order_by(models.Expense.date.desc())
        .limit(30)
        .all()
    )

    return {
        "summary": {
            "total_income": float(total_income),
            "total_expense": float(total_expense),
            "total_balance": float(balance),
        },
        "recent_transactions": [dict(r._asdict()) for r in recent],
        "income_chart": [{"date": r.date, "total": float(r.total)} for r in income_chart],
        "expense_chart": [{"date": r.date, "total": float(r.total)} for r in expense_chart],
    }


def get_recent_transactions(db: Session, user_id: UUID, limit: int = 10):
    recent = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == user_id)
        .order_by(models.Transaction.transaction_date.desc())
        .limit(limit)
        .all()
    )
    return recent


def get_monthly_summary(db: Session, user_id: UUID, year: int):
    result = (
        db.query(
            func.date_trunc('month', models.Transaction.transaction_date).label('month'),
            func.sum(
                func.case(
                    (models.Transaction.type == 'income', models.Transaction.amount),
                    else_=0
                )
            ).label('total_income'),
            func.sum(
                func.case(
                    (models.Transaction.type == 'expense', models.Transaction.amount),
                    else_=0
                )
            ).label('total_expense'),
        )
        .filter(models.Transaction.user_id == user_id)
        .group_by(func.date_trunc('month', models.Transaction.transaction_date))
        .order_by('month')
        .all()
    )
    return [
        {
            "month": r.month.strftime("%Y-%m"),
            "income": float(r.total_income),
            "expense": float(r.total_expense)
        } for r in result
    ]


def get_income_summary(db: Session, user_id: UUID):
    return db.query(func.coalesce(func.sum(models.Income.amount), 0)).filter(models.Income.user_id == user_id).scalar()

def get_expense_summary(db: Session, user_id: UUID):
    return db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(models.Expense.user_id == user_id).scalar()
