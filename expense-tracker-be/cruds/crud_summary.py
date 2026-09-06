# crud_summary.py
from decimal import Decimal

from sqlalchemy.orm import Session
from uuid import UUID
from sqlalchemy import func
from models import transaction_model, category_model
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
    from sqlalchemy import case

    result = (
        db.query(
            func.date_trunc("month", transaction_model.Transaction.date).label("month"),
            func.sum(
                case(
                    (transaction_model.Transaction.type == "income", transaction_model.Transaction.amount),
                    else_=0,
                )
            ).label("total_income"),
            func.sum(
                case(
                    (transaction_model.Transaction.type == "expense", transaction_model.Transaction.amount),
                    else_=0,
                )
            ).label("total_expense"),
        )
        .filter(
            transaction_model.Transaction.user_id == user_id,
            func.extract("year", transaction_model.Transaction.date) == year,
        )
        .group_by(func.date_trunc("month", transaction_model.Transaction.date))
        .order_by("month")
        .all()
    )
    return [
        {
            "month": row.month.strftime("%Y-%m"),
            "income": float(row.total_income or 0),
            "expense": float(row.total_expense or 0),
        }
        for row in result
    ]


def get_monthly_budget_status(db: Session, user_id: UUID, year: int | None = None, month: int | None = None):
    """
    Budget status helper for dashboard.
    - monthly_budget = budget_limit
    - spent_this_month = sum(expense amounts) for current month
    - remaining_budget = budget_limit - spent_this_month
    - NO DB mutation
    """
    from models import user_model

    now = datetime.utcnow().date()
    year = year or now.year
    month = month or now.month

    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    # BUGFIX (Wave 02B): field đúng là `monthly_budget` (User không có `budget_limit`),
    # trước đây getattr luôn trả 0 => dashboard budget_limit/remaining luôn sai.
    budget_limit = float(getattr(user, "monthly_budget", 0) or 0)

    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    spent_this_month = (
        db.query(func.coalesce(func.sum(transaction_model.Transaction.amount), 0))
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense",
            transaction_model.Transaction.date >= start_date,
            transaction_model.Transaction.date < end_date,
        )
        .scalar()
    )

    spent_this_month = float(spent_this_month or 0)
    remaining_budget = float(budget_limit) - spent_this_month

    return {
        "budget_limit": float(budget_limit),
        "spent_this_month": spent_this_month,
        "remaining_budget": float(remaining_budget),
    }


def get_dashboard_data(db: Session, user_id: UUID):
    from models import user_model

    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()

    total_income = (
        db.query(func.coalesce(func.sum(transaction_model.Transaction.amount), 0))
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "income",
        )
        .scalar()
    )
    total_expense = (
        db.query(func.coalesce(func.sum(transaction_model.Transaction.amount), 0))
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense",
        )
        .scalar()
    )
    balance = float(total_income) - float(total_expense)

    recent_transactions = (
        db.query(transaction_model.Transaction)
        .filter(transaction_model.Transaction.user_id == user_id)
        .order_by(
            transaction_model.Transaction.date.desc(),
            transaction_model.Transaction.created_at.desc(),
        )
        .limit(10)
        .all()
    )

    income_chart = (
        db.query(
            transaction_model.Transaction.date,
            func.sum(transaction_model.Transaction.amount).label("total"),
        )
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "income",
        )
        .group_by(transaction_model.Transaction.date)
        .order_by(transaction_model.Transaction.date.desc())
        .limit(30)
        .all()
    )
    expense_chart = (
        db.query(
            transaction_model.Transaction.date,
            func.sum(transaction_model.Transaction.amount).label("total"),
        )
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense",
        )
        .group_by(transaction_model.Transaction.date)
        .order_by(transaction_model.Transaction.date.desc())
        .limit(30)
        .all()
    )

    monthly_budget_status = get_monthly_budget_status(db=db, user_id=user_id)

    return {
        "summary": {
            "total_income": float(total_income or 0),
            "total_expense": float(total_expense or 0),
            "total_balance": balance,
            "is_positive": balance >= 0,
            "currency": getattr(user, "currency_code", "USD"),
            # Phase 4 budget status (read-only)
            "budget_limit": monthly_budget_status["budget_limit"],
            "spent_this_month": monthly_budget_status["spent_this_month"],
            "remaining_budget": monthly_budget_status["remaining_budget"],
        },
        "recent_transactions": recent_transactions,
        "income_chart": [{"date": row.date, "total": float(row.total or 0)} for row in income_chart],
        "expense_chart": [{"date": row.date, "total": float(row.total or 0)} for row in expense_chart],
    }


def get_analytics_trends_data(db: Session, user_id: UUID):
    income_data = (
        db.query(
            transaction_model.Transaction.date,
            func.sum(transaction_model.Transaction.amount).label("total"),
        )
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "income",
        )
        .group_by(transaction_model.Transaction.date)
        .order_by(transaction_model.Transaction.date.asc())
        .limit(60)
        .all()
    )

    expense_data = (
        db.query(
            transaction_model.Transaction.date,
            func.sum(transaction_model.Transaction.amount).label("total"),
        )
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense",
        )
        .group_by(transaction_model.Transaction.date)
        .order_by(transaction_model.Transaction.date.asc())
        .limit(60)
        .all()
    )

    return {
        "income_trend": [{"date": str(row.date), "amount": float(row.total or 0)} for row in income_data],
        "expense_trend": [{"date": str(row.date), "amount": float(row.total or 0)} for row in expense_data],
    }


def get_expense_daily_trend(db: Session, user_id: UUID, days: int = 30):
    start_date = date.today() - timedelta(days=days - 1)

    expense_data = (
        db.query(
            transaction_model.Transaction.date.label("date"),
            func.sum(transaction_model.Transaction.amount).label("total_amount"),
        )
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense",
            transaction_model.Transaction.date >= start_date,
        )
        .group_by(transaction_model.Transaction.date)
        .order_by(transaction_model.Transaction.date.asc())
        .all()
    )

    return [
        {"date": row.date, "total_amount": float(row.total_amount or 0)}
        for row in expense_data
    ]


def get_financial_kpi_summary(db: Session, user_id: UUID):
    total_income = (
        db.query(func.sum(transaction_model.Transaction.amount))
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "income",
        )
        .scalar()
        or Decimal(0)
    )
    total_expense = (
        db.query(func.sum(transaction_model.Transaction.amount))
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense",
        )
        .scalar()
        or Decimal(0)
    )

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "income_growth": 0.0,
        "expense_growth": 0.0,
    }


def get_period_summary(db: Session, user_id, start_date: date, end_date: date):
    try:
        total_income = (
            db.query(func.sum(transaction_model.Transaction.amount))
            .filter(
                transaction_model.Transaction.user_id == user_id,
                transaction_model.Transaction.type == "income",
                transaction_model.Transaction.date >= start_date,
                transaction_model.Transaction.date <= end_date,
            )
            .scalar()
            or Decimal(0)
        )
        total_expense = (
            db.query(func.sum(transaction_model.Transaction.amount))
            .filter(
                transaction_model.Transaction.user_id == user_id,
                transaction_model.Transaction.type == "expense",
                transaction_model.Transaction.date >= start_date,
                transaction_model.Transaction.date <= end_date,
            )
            .scalar()
            or Decimal(0)
        )

        return {
            "total_income": float(total_income),
            "total_expense": float(total_expense),
            "net_balance": float(total_income - total_expense),
        }
    except Exception as e:
        print(f"Error in get_period_summary: {e}")
        return {
            "total_income": 0.0,
            "total_expense": 0.0,
            "net_balance": 0.0,
        }


def get_period_breakdown(db: Session, user_id, start_date: date, end_date: date):
    results = (
        db.query(
            transaction_model.Transaction.category_name,
            func.sum(transaction_model.Transaction.amount).label("total"),
        )
        .filter(
            transaction_model.Transaction.user_id == user_id,
            transaction_model.Transaction.type == "expense",
            transaction_model.Transaction.date >= start_date,
            transaction_model.Transaction.date <= end_date,
        )
        .group_by(transaction_model.Transaction.category_name)
        .order_by(func.sum(transaction_model.Transaction.amount).desc())
        .all()
    )

    return [
        {"name": row.category_name or "Uncategorized", "value": float(row.total or 0)}
        for row in results
        if row.total and row.total > 0
    ]
