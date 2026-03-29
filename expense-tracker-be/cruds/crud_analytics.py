from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from uuid import UUID
from typing import Optional, Dict, List, Any
from decimal import Decimal

from models import transaction_model, user_model
from schemas.analytics_schemas import CategorySummary, AnalyticsFilter, AnalyticsSummary


def get_user_currency_symbol(db: Session, user_id: UUID) -> str:
    user = db.query(user_model.User.currency_symbol).filter(user_model.User.id == user_id).first()
    return user[0] if user and user[0] else "$"


def get_analytics_summary_data(
        db: Session,
        user_id: UUID,
        filters: AnalyticsFilter
) -> Dict[str, Any]:
    """
    Tối ưu hóa: Query trực tiếp trên 1 bảng duy nhất (Transaction).
    Sử dụng SQL Aggregation để tính toán cực nhanh.
    """
    
    # 1. Khởi tạo truy vấn cơ sở
    query = db.query(transaction_model.Transaction).filter(transaction_model.Transaction.user_id == user_id)

    # 2. Áp dụng bộ lọc
    if filters.start_date:
        query = query.filter(transaction_model.Transaction.date >= filters.start_date)
    if filters.end_date:
        query = query.filter(transaction_model.Transaction.date <= filters.end_date)
    if filters.category_id:
        query = query.filter(transaction_model.Transaction.category_id == filters.category_id)
    if filters.type and filters.type != 'all':
        query = query.filter(transaction_model.Transaction.type == filters.type)

    # 3. Tính toán Tổng Thu và Tổng Chi trong 1 lần gọi DB (nếu filters.type == 'all')
    totals = db.query(
        transaction_model.Transaction.type,
        func.sum(transaction_model.Transaction.amount).label("total")
    ).filter(
        transaction_model.Transaction.user_id == user_id,
        transaction_model.Transaction.date >= (filters.start_date or date(1970,1,1)),
        transaction_model.Transaction.date <= (filters.end_date or date.today())
    ).group_by(transaction_model.Transaction.type).all()

    total_income = Decimal(0)
    total_expense = Decimal(0)
    for t_type, t_amount in totals:
        if t_type == 'income': total_income = t_amount
        elif t_type == 'expense': total_expense = t_amount

    # 4. Phân phối theo Danh mục (Category Distribution)
    # Query này sẽ lấy tổng tiền theo từng danh mục và loại
    dist_query = db.query(
        transaction_model.Transaction.category_name,
        transaction_model.Transaction.type,
        func.sum(transaction_model.Transaction.amount).label("total")
    ).filter(
        transaction_model.Transaction.user_id == user_id,
        transaction_model.Transaction.date >= (filters.start_date or date(1970,1,1)),
        transaction_model.Transaction.date <= (filters.end_date or date.today())
    )
    
    if filters.type and filters.type != 'all':
        dist_query = dist_query.filter(transaction_model.Transaction.type == filters.type)
        
    category_distribution_raw = dist_query.group_by(
        transaction_model.Transaction.category_name, 
        transaction_model.Transaction.type
    ).all()

    category_distribution = [
        CategorySummary(category_name=name, total_amount=amount, type=t_type)
        for name, t_type, amount in category_distribution_raw
    ]

    # 5. Danh sách giao dịch chi tiết (có phân trang ngầm định limit 100 để tránh lag)
    detailed_transactions = query.order_by(transaction_model.Transaction.date.desc()).limit(100).all()

    currency_symbol = get_user_currency_symbol(db, user_id)

    return AnalyticsSummary(
        total_income=total_income,
        total_expense=total_expense,
        total_balance=total_income - total_expense,
        category_distribution=category_distribution,
        transactions=detailed_transactions,
        currency_symbol=currency_symbol
    ).model_dump()


def _apply_filters(query, filters: AnalyticsFilter):
    if filters.start_date:
        query = query.filter(transaction_model.Transaction.date >= filters.start_date)
    if filters.end_date:
        query = query.filter(transaction_model.Transaction.date <= filters.end_date)
    if filters.category_id:
        query = query.filter(transaction_model.Transaction.category_id == filters.category_id)
    if filters.type and filters.type != "all":
        query = query.filter(transaction_model.Transaction.type == filters.type)
    return query


def get_analytics_summary_data(
        db: Session,
        user_id: UUID,
        filters: AnalyticsFilter
) -> Dict[str, Any]:
    base_query = db.query(transaction_model.Transaction).filter(
        transaction_model.Transaction.user_id == user_id
    )
    filtered_query = _apply_filters(base_query, filters)

    totals = (
        filtered_query.with_entities(
            transaction_model.Transaction.type,
            func.sum(transaction_model.Transaction.amount).label("total")
        )
        .group_by(transaction_model.Transaction.type)
        .all()
    )

    total_income = Decimal(0)
    total_expense = Decimal(0)
    for t_type, t_amount in totals:
        if t_type == "income":
            total_income = t_amount or Decimal(0)
        elif t_type == "expense":
            total_expense = t_amount or Decimal(0)

    category_distribution_raw = (
        filtered_query.with_entities(
            transaction_model.Transaction.category_name,
            transaction_model.Transaction.type,
            func.sum(transaction_model.Transaction.amount).label("total")
        )
        .group_by(
            transaction_model.Transaction.category_name,
            transaction_model.Transaction.type
        )
        .all()
    )
    category_distribution = [
        CategorySummary(
            category_name=name or "Uncategorized",
            total_amount=amount,
            type=t_type,
        )
        for name, t_type, amount in category_distribution_raw
    ]

    detailed_transactions = (
        filtered_query.order_by(
            transaction_model.Transaction.date.desc(),
            transaction_model.Transaction.created_at.desc(),
        )
        .limit(100)
        .all()
    )

    expense_by_day = (
        _apply_filters(base_query, filters)
        .filter(transaction_model.Transaction.type == "expense")
        .with_entities(
            transaction_model.Transaction.date.label("date"),
            func.sum(transaction_model.Transaction.amount).label("total")
        )
        .group_by(transaction_model.Transaction.date)
        .order_by(transaction_model.Transaction.date.asc())
        .all()
    )

    if expense_by_day:
        most_expensive_day = max(expense_by_day, key=lambda row: row.total).date
        range_start = filters.start_date or expense_by_day[0].date
        range_end = filters.end_date or expense_by_day[-1].date
        day_span = max((range_end - range_start).days + 1, 1)
        average_daily_spending = total_expense / Decimal(day_span)
    else:
        most_expensive_day = None
        average_daily_spending = Decimal(0)

    currency_symbol = get_user_currency_symbol(db, user_id)

    return AnalyticsSummary(
        total_income=total_income,
        total_expense=total_expense,
        total_balance=total_income - total_expense,
        average_daily_spending=average_daily_spending,
        most_expensive_day=most_expensive_day,
        category_distribution=category_distribution,
        transactions=detailed_transactions,
        currency_symbol=currency_symbol
    ).model_dump(mode="json")
