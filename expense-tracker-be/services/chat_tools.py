# services/chat_tools.py
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import date
from decimal import Decimal
from cruds import crud_income, crud_expense, crud_summary
from models import user_model, category_model
from sqlalchemy import func
import json  # ✅ Import JSON


# --- SCHEMAS ---
class CreateTransactionInput(BaseModel):
    type: str = Field(description="Loại: 'income' hoặc 'expense'")
    amount: float = Field(description="Số tiền (VNĐ)")
    category_name: str = Field(description="Tên danh mục")
    note: str = Field(default="", description="Ghi chú")


class DateRangeInput(BaseModel):
    start_date: str = Field(description="YYYY-MM-DD")
    end_date: str = Field(description="YYYY-MM-DD")


# ✅ Schema cho Tool vẽ biểu đồ
class AnalyzeInput(BaseModel):
    start_date: str = Field(description="YYYY-MM-DD")
    end_date: str = Field(description="YYYY-MM-DD")


def get_finbot_tools(db: Session, user: user_model.User):
    # (Hàm find_existing_category giữ nguyên)
    def find_existing_category(name: str, type: str):
        cat = db.query(category_model.Category).filter(
            category_model.Category.user_id == user.id,
            func.lower(category_model.Category.name) == name.lower().strip(),
            category_model.Category.type == type
        ).first()
        if cat: return cat
        return db.query(category_model.Category).filter(
            category_model.Category.user_id == None,
            func.lower(category_model.Category.name) == name.lower().strip(),
            category_model.Category.type == type
        ).first()

    # TOOL 1: GHI CHÉP (Giữ nguyên)
    def create_transaction_func(type: str, amount: float, category_name: str, note: str = ""):
        try:
            clean_type = type.lower().strip()
            dec_amount = Decimal(str(amount))
            existing_cat = find_existing_category(category_name, clean_type)

            cat_id = existing_cat.id if existing_cat else None
            final_name = existing_cat.name if existing_cat else category_name
            final_emoji = None if existing_cat else "🤖"

            if clean_type == "income":
                crud_income.create_income(db, user.id, final_name, dec_amount, user.currency_code or "USD",
                                          date.today(), final_emoji, cat_id)
                return f"[REFRESH] ✅ Đã thêm THU NHẬP: {amount:,.0f} vào '{final_name}'."
            elif clean_type == "expense":
                crud_expense.create_expense(db, user.id, final_name, dec_amount, user.currency_code or "USD",
                                            date.today(), final_emoji, cat_id)
                return f"[REFRESH] ✅ Đã thêm CHI TIÊU: {amount:,.0f} vào '{final_name}'."
            return "❌ Lỗi loại giao dịch."
        except Exception as e:
            return f"❌ Lỗi: {str(e)}"

    # TOOL 2: SỐ DƯ (Giữ nguyên)
    def get_balance_func():
        try:
            summary = crud_summary.get_financial_kpi_summary(db, user.id)
            return {
                "total_income": float(summary["total_income"]),
                "total_expense": float(summary["total_expense"]),
                "net_balance": float(summary["total_income"] - summary["total_expense"])
            }
        except Exception as e:
            return f"Lỗi: {str(e)}"

    # TOOL 3: THỐNG KÊ CƠ BẢN (Giữ nguyên)
    def get_statistics_func(start_date: str, end_date: str):
        try:
            s_date = date.fromisoformat(start_date)
            e_date = date.fromisoformat(end_date)
            stats = crud_summary.get_period_summary(db, user.id, s_date, e_date)
            return {
                "period": f"{start_date} -> {end_date}",
                "income": stats["total_income"],
                "expense": stats["total_expense"],
                "balance": stats["net_balance"]
            }
        except Exception as e:
            return f"Lỗi: {str(e)}"

    # ✅ TOOL 4: PHÂN TÍCH & VẼ BIỂU ĐỒ (QUAN TRỌNG)
        # ✅ CẬP NHẬT TOOL NÀY
    def analyze_spending_func(start_date: str, end_date: str):
        try:
            s_date = date.fromisoformat(start_date)
            e_date = date.fromisoformat(end_date)

            breakdown = crud_summary.get_period_breakdown(db, user.id, s_date, e_date)

            if not breakdown:
                return "Không có dữ liệu chi tiêu để vẽ biểu đồ."

            chart_data = {
                "type": "pie",
                "data": breakdown,
                "title": f"Chi tiêu {start_date} đến {end_date}"
            }

            # ✅ SỬA: Dùng cặp thẻ START/END rõ ràng, tránh trùng lặp
            return f"Dưới đây là biểu đồ chi tiêu của bạn:\n[CHART_DATA_START]{json.dumps(chart_data)}[CHART_DATA_END]"

        except Exception as e:
            return f"Lỗi vẽ biểu đồ: {str(e)}"

    # TRẢ VỀ ĐỦ 4 TOOLS
    return [
        StructuredTool.from_function(func=create_transaction_func, name="create_transaction",
                                     description="Ghi chép thu nhập/chi tiêu.", args_schema=CreateTransactionInput),
        StructuredTool.from_function(func=get_balance_func, name="get_balance", description="Xem số dư."),
        StructuredTool.from_function(func=get_statistics_func, name="get_statistics",
                                     description="Thống kê tổng quan (không vẽ hình).", args_schema=DateRangeInput),
        # ✅ Đăng ký tool mới
        StructuredTool.from_function(func=analyze_spending_func, name="analyze_spending",
                                     description="Vẽ biểu đồ phân tích chi tiêu.", args_schema=AnalyzeInput)
    ]