# crud_summary.py
from sqlalchemy.orm import Session
from uuid import UUID
from sqlalchemy import func, desc
import models
# Giả sử crud_income và crud_expense đã được import để lấy các hàm summary
# from .crud_income import get_income_summary
# from .crud_expense import get_expense_summary

# Lưu ý: Vì bạn chưa cung cấp file models, tôi giữ lại các hàm summary trong file này
# và giả sử các hàm get_income_summary/get_expense_summary đã được định nghĩa
# hoặc import đúng cách nếu sử dụng dashboard.

def get_financial_summary_from_transactions(db: Session, user_id: UUID):
    """Tính tổng thu nhập, chi tiêu và số dư (dùng bảng Transaction)."""
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
    """Tính tổng chi tiêu theo Category (dùng bảng Transaction)."""
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


def get_monthly_summary(db: Session, user_id: UUID, year: int):
    """Tính tổng thu nhập và chi tiêu theo từng tháng (dùng bảng Transaction)."""
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


def get_dashboard_data(db: Session, user_id: UUID):
    """Lấy toàn bộ dữ liệu cần thiết cho Dashboard."""
    # Bạn sẽ cần thay thế các hàm này bằng cách import từ crud_income/crud_expense
    # Hoặc định nghĩa lại chúng tại đây nếu không muốn import chéo.
    # Để code chạy được độc lập, ta định nghĩa lại (dù đã có trong crud_income/expense)
    total_income = db.query(func.coalesce(func.sum(models.Income.amount), 0)).filter(models.Income.user_id == user_id).scalar()
    total_expense = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(models.Expense.user_id == user_id).scalar()
    balance = float(total_income) - float(total_expense)

    # Giao dịch gần đây (Union từ Income và Expense)
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

    # Chart dữ liệu Income
    income_chart = (
        db.query(models.Income.date, func.sum(models.Income.amount).label("total"))
        .filter(models.Income.user_id == user_id)
        .group_by(models.Income.date)
        .order_by(models.Income.date.desc())
        .limit(30)
        .all()
    )
    # Chart dữ liệu Expense
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

# ... trong file cruds/crud_summary.py

def get_analytics_trends_data(db: Session, user_id: UUID):
    """Lấy dữ liệu xu hướng thu nhập và chi tiêu theo ngày (60 ngày gần nhất)."""
    from sqlalchemy import func

    # Dữ liệu xu hướng Income
    income_data = (
        db.query(models.Income.date, func.sum(models.Income.amount))
        .filter(models.Income.user_id == user_id)
        .group_by(models.Income.date)
        .order_by(models.Income.date)
        .limit(60)
        .all()
    )

    # Dữ liệu xu hướng Expense
    expense_data = (
        db.query(models.Expense.date, func.sum(models.Expense.amount))
        .filter(models.Expense.user_id == user_id)
        .group_by(models.Expense.date)
        .order_by(models.Expense.date)
        .limit(60)
        .all()
    )

    return {
        "income_trend": [{"date": str(d), "amount": float(a)} for d, a in income_data],
        "expense_trend": [{"date": str(d), "amount": float(a)} for d, a in expense_data],
    }