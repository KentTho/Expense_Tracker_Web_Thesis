from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from datetime import date
from uuid import UUID
from typing import Optional, Dict, List, Any
from decimal import Decimal

import models
from schemas.analytics_schemas import CategorySummary, AnalyticsFilter, AnalyticsSummary


# =========================================================
# ⚙️ HELPER: Lấy Currency Symbol (Giả định nằm trong User Model)
# =========================================================
def get_user_currency_symbol(db: Session, user_id: UUID) -> str:
    """Lấy ký hiệu tiền tệ của người dùng từ cài đặt."""
    # ✅ DỰA VÀO models.py: User model đã có trường currency_symbol
    user = db.query(models.User.currency_symbol).filter(models.User.id == user_id).first()
    return user[0] if user and user[0] else "$"


# =========================================================
# 📊 HÀM CHÍNH: LẤY DỮ LIỆU PHÂN TÍCH
# =========================================================
def get_analytics_summary_data(
        db: Session,
        user_id: UUID,
        filters: AnalyticsFilter
) -> Dict[str, Any]:
    """
    Lấy dữ liệu tổng hợp cho trang Analytics dựa trên bộ lọc.
    """

    # 1. Khởi tạo truy vấn cơ sở
    base_income_query = db.query(models.Income).filter(models.Income.user_id == user_id)
    base_expense_query = db.query(models.Expense).filter(models.Expense.user_id == user_id)

    # 2. Áp dụng bộ lọc thời gian
    if filters.start_date:
        base_income_query = base_income_query.filter(models.Income.date >= filters.start_date)
        base_expense_query = base_expense_query.filter(models.Expense.date >= filters.start_date)

    if filters.end_date:
        base_income_query = base_income_query.filter(models.Income.date <= filters.end_date)
        base_expense_query = base_expense_query.filter(models.Expense.date <= filters.end_date)

    # 3. Tính toán Tổng Thu Nhập và Chi Tiêu
    total_income_result = base_income_query.with_entities(func.sum(models.Income.amount)).scalar() or Decimal(0)
    total_expense_result = base_expense_query.with_entities(func.sum(models.Expense.amount)).scalar() or Decimal(0)

    # 4. Tính toán Phân phối theo Danh mục (Category Distribution)
    category_distribution: List[CategorySummary] = []

    # 4a. Phân phối Thu nhập
    if filters.type in ['all', 'income']:
        income_summary = (
            base_income_query.with_entities(
                models.Income.category_name,
                func.sum(models.Income.amount).label("total_amount")
            )
            .group_by(models.Income.category_name)
            .all()
        )
        for name, amount in income_summary:
            category_distribution.append(CategorySummary(
                category_name=name, total_amount=amount, type='income'
            ))

    # 4b. Phân phối Chi tiêu
    if filters.type in ['all', 'expense']:
        expense_summary = (
            base_expense_query.with_entities(
                models.Expense.category_name,
                func.sum(models.Expense.amount).label("total_amount")
            )
            .group_by(models.Expense.category_name)
            .all()
        )
        for name, amount in expense_summary:
            category_distribution.append(CategorySummary(
                category_name=name, total_amount=amount, type='expense'
            ))

    # 5. Lấy danh sách giao dịch chi tiết (cho bảng Detailed Transactions)
    detailed_transactions: List[Any] = []

    if filters.type in ['all', 'income']:
        # Lấy chi tiết Income, sắp xếp mới nhất lên đầu
        incomes = base_income_query.order_by(models.Income.date.desc()).all()
        detailed_transactions.extend(incomes)

    if filters.type in ['all', 'expense']:
        # Lấy chi tiết Expense, sắp xếp mới nhất lên đầu
        expenses = base_expense_query.order_by(models.Expense.date.desc()).all()
        detailed_transactions.extend(expenses)

    # Sắp xếp chung cho bảng chi tiết (mới nhất lên đầu)
    # LƯU Ý: Frontend đã có logic lọc và sắp xếp, nhưng nên sắp xếp ở BE
    detailed_transactions.sort(key=lambda t: t.date, reverse=True)

    # 6. Trả về kết quả cuối cùng (Sử dụng Pydantic Model để tự động format)
    # Lấy currency symbol
    currency_symbol = get_user_currency_symbol(db, user_id)

    return AnalyticsSummary(
        total_income=total_income_result,
        total_expense=total_expense_result,
        total_balance=total_income_result - total_expense_result,
        category_distribution=category_distribution,
        transactions=detailed_transactions,
        currency_symbol=currency_symbol
    ).model_dump()  # Dùng model_dump() để chuyển sang dict chuẩn