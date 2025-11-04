from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Dict, Any, Optional

from cruds.crud_analytics import get_analytics_summary_data
from db.database import get_db
from schemas.analytics_schemas import AnalyticsSummary, AnalyticsFilter
from services.auth_token_db import get_current_user_db  # Giả định user dependency

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
        # ✅ Sử dụng Query Params cho bộ lọc
        type: str = Query('all', description="Transaction type: 'all', 'income', or 'expense'"),
        start_date: Optional[date] = Query(None, description="Start date for filtering"),
        end_date: Optional[date] = Query(None, description="End date for filtering"),
        category_id: Optional[str] = Query(None, description="Category ID (UUID) for filtering"),

        current_user=Depends(get_current_user_db),
        db: Session = Depends(get_db)
):
    """
    Lấy dữ liệu tổng hợp (Bar, Pie, Bảng chi tiết) cho trang Analytics.
    """

    # 1. Tạo đối tượng Filter từ Query Parameters
    filters = AnalyticsFilter(
        type=type,
        start_date=start_date,
        end_date=end_date,
        # Chuyển đổi category_id từ str sang UUID nếu có
        category_id=category_id
    )

    # 2. Gọi hàm CRUD để lấy dữ liệu
    summary_data = get_analytics_summary_data(db, current_user.id, filters)

    # 3. Trả về dữ liệu (FastAPI sẽ tự động map với AnalyticsSummary)
    return summary_data