# crud_summary.py
from decimal import Decimal

from sqlalchemy.orm import Session
from uuid import UUID
from sqlalchemy import func, desc
from models import transaction_model, category_model, income_model, expense_model
from datetime import datetime, timedelta, date
# Giả sử crud_income và crud_expense đã được import để lấy các hàm summary
# from .crud_income import get_income_summary
# from .crud_expense import get_expense_summary

# Lưu ý: Vì bạn chưa cung cấp file transaction_model, tôi giữ lại các hàm summary trong file này
# và giả sử các hàm get_income_summary/get_expense_summary đã được định nghĩa
# hoặc import đúng cách nếu sử dụng dashboard.

def get_financial_summary_from_transactions(db: Session, user_id: UUID):
    """Tính tổng thu nhập, chi tiêu và số dư (dùng bảng Transaction)."""
    total_income = (
        db.query(func.sum(transaction_model.Transaction.amount))
        .filter(transaction_model.Transaction.user_id == user_id, transaction_model.Transaction.type == "income")
        .scalar()
        or 0
    )
    total_expense = (
        db.query(func.sum(transaction_model.Transaction.amount))
        .filter(transaction_model.Transaction.user_id == user_id, transaction_model.Transaction.type == "expense")
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
    """Tính tổng chi tiêu theo Category (dùng bảng Transaction)."""
    result = (
        db.query(
            category_model.Category.name,
            func.sum(transaction_model.Transaction.amount).label("total_amount")
        )
        .join(transaction_model.Transaction, transaction_model.Transaction.category_id == category_model.Category.id)
        .filter(transaction_model.Transaction.user_id == user_id, transaction_model.Transaction.type == "expense")
        .group_by(category_model.Category.name)
        .all()
    )
    return [{"category": r[0], "total": float(r[1])} for r in result]


def get_monthly_summary(db: Session, user_id: UUID, year: int):
    """Tính tổng thu nhập và chi tiêu theo từng tháng (dùng bảng Transaction)."""
    result = (
        db.query(
            func.date_trunc('month', transaction_model.Transaction.transaction_date).label('month'),
            func.sum(
                func.case(
                    (transaction_model.Transaction.type == 'income', transaction_model.Transaction.amount),
                    else_=0
                )
            ).label('total_income'),
            func.sum(
                func.case(
                    (transaction_model.Transaction.type == 'expense', transaction_model.Transaction.amount),
                    else_=0
                )
            ).label('total_expense'),
        )
        .filter(transaction_model.Transaction.user_id == user_id)
        .group_by(func.date_trunc('month', transaction_model.Transaction.transaction_date))
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


def get_dashboard_data(db: Session, user_id: UUID):
    """Lấy toàn bộ dữ liệu cần thiết cho Dashboard."""
    # Bạn sẽ cần thay thế các hàm này bằng cách import từ crud_income/crud_expense
    # Hoặc định nghĩa lại chúng tại đây nếu không muốn import chéo.
    # Để code chạy được độc lập, ta định nghĩa lại (dù đã có trong crud_income/expense)
    total_income = db.query(func.coalesce(func.sum(income_model.Income.amount), 0)).filter(income_model.Income.user_id == user_id).scalar()
    total_expense = db.query(func.coalesce(func.sum(expense_model.Expense.amount), 0)).filter(expense_model.Expense.user_id == user_id).scalar()
    balance = float(total_income) - float(total_expense)

    # Giao dịch gần đây (Union từ Income và Expense)
    recent = (
        db.query(income_model.Income.category_name.label("name"),
                 income_model.Income.amount,
                 income_model.Income.date,
                 income_model.Income.emoji,
                 func.literal("income").label("type"))
        .filter(income_model.Income.user_id == user_id)
        .union_all(
            db.query(expense_model.Expense.category_name.label("name"),
                     expense_model.Expense.amount,
                     expense_model.Expense.date,
                     expense_model.Expense.emoji,
                     func.literal("expense").label("type"))
            .filter(expense_model.Expense.user_id == user_id)
        )
        .order_by(desc("date"))
        .limit(10)
        .all()
    )

    # Chart dữ liệu Income
    income_chart = (
        db.query(income_model.Income.date, func.sum(income_model.Income.amount).label("total"))
        .filter(income_model.Income.user_id == user_id)
        .group_by(income_model.Income.date)
        .order_by(income_model.Income.date.desc())
        .limit(30)
        .all()
    )
    # Chart dữ liệu Expense
    expense_chart = (
        db.query(expense_model.Expense.date, func.sum(expense_model.Expense.amount).label("total"))
        .filter(expense_model.Expense.user_id == user_id)
        .group_by(expense_model.Expense.date)
        .order_by(expense_model.Expense.date.desc())
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

# ... trong file cruds/crud_summary.py

def get_analytics_trends_data(db: Session, user_id: UUID):
    """Lấy dữ liệu xu hướng thu nhập và chi tiêu theo ngày (60 ngày gần nhất)."""
    from sqlalchemy import func

    # Dữ liệu xu hướng Income
    income_data = (
        db.query(income_model.Income.date, func.sum(income_model.Income.amount))
        .filter(income_model.Income.user_id == user_id)
        .group_by(income_model.Income.date)
        .order_by(income_model.Income.date)
        .limit(60)
        .all()
    )

    # Dữ liệu xu hướng Expense
    expense_data = (
        db.query(expense_model.Expense.date, func.sum(expense_model.Expense.amount))
        .filter(expense_model.Expense.user_id == user_id)
        .group_by(expense_model.Expense.date)
        .order_by(expense_model.Expense.date)
        .limit(60)
        .all()
    )

    return {
        "income_trend": [{"date": str(d), "amount": float(a)} for d, a in income_data],
        "expense_trend": [{"date": str(d), "amount": float(a)} for d, a in expense_data],
    }


def get_expense_daily_trend(db: Session, user_id: UUID, days: int = 30):
    """Lấy tổng chi tiêu theo ngày trong N ngày gần nhất (từ bảng Expense)."""
    # Lấy ngày bắt đầu N ngày trước
    start_date = datetime.now().date() - timedelta(days=days - 1)

    expense_data = (
        db.query(expense_model.Expense.date, func.sum(expense_model.Expense.amount).label("total"))
        .filter(expense_model.Expense.user_id == user_id, expense_model.Expense.date >= start_date)
        .group_by(expense_model.Expense.date)
        .order_by(expense_model.Expense.date.asc())  # Sắp xếp tăng dần theo ngày
        .all()
    )

    # Chuẩn hóa kết quả
    return [
        {"date": str(r.date), "total_amount": float(r.total)}
        for r in expense_data
    ]


# cruds/crud_summary.py (Hoặc cuối crud_income.py)
# ... (imports)

def get_financial_kpi_summary(db: Session, user_id: UUID):
    """💰 Lấy tổng thu và tổng chi cho KPI Cards"""

    # 1. Tổng thu
    total_income = db.query(func.sum(income_model.Income.amount)).filter(
        income_model.Income.user_id == user_id).scalar() or Decimal(0)

    # 2. Tổng chi
    total_expense = db.query(func.sum(expense_model.Expense.amount)).filter(
        expense_model.Expense.user_id == user_id).scalar() or Decimal(0)

    return {
        "total_income": total_income,
        "total_expense": total_expense,
    }

# Sử dụng lại get_expense_summary từ crud_expense.py cho Breakdown Pie Chart:
# get_expense_summary(db: Session, user_id: UUID)

# ✅ HÀM MỚI: Thống kê theo khoảng thời gian
def get_period_summary(db: Session, user_id: UUID, start_date: date, end_date: date):
    """
    Tính tổng thu và chi trong một khoảng thời gian cụ thể (Inclusive).
    """
    # 1. Tính tổng thu
    total_income = db.query(func.sum(income_model.Income.amount)).filter(
        income_model.Income.user_id == user_id,
        income_model.Income.date >= start_date,
        income_model.Income.date <= end_date
    ).scalar() or Decimal(0)

    # 2. Tính tổng chi
    total_expense = db.query(func.sum(expense_model.Expense.amount)).filter(
        expense_model.Expense.user_id == user_id,
        expense_model.Expense.date >= start_date,
        expense_model.Expense.date <= end_date
    ).scalar() or Decimal(0)

    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "net_balance": float(total_income - total_expense)
    }