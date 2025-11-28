# services/chat_tools.py
from langchain_core.tools import StructuredTool
from mako.testing.helpers import result_lines
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import date
from decimal import Decimal
from cruds import crud_income, crud_expense, crud_summary, crud_transaction
from models import user_model, category_model
from sqlalchemy import func
import json


# --- SCHEMAS ---
class CreateTransactionInput(BaseModel):
    type: str = Field(description="Loại: 'income' hoặc 'expense'")
    amount: float = Field(description="Số tiền (VNĐ)")
    category_name: str = Field(description="Tên danh mục")
    note: str = Field(default="", description="Ghi chú")
    date_str: str = Field(default=None, description="Ngày (YYYY-MM-DD)")


class DateRangeInput(BaseModel):
    start_date: str = Field(description="YYYY-MM-DD")
    end_date: str = Field(description="YYYY-MM-DD")


class AnalyzeInput(BaseModel):
    start_date: str = Field(description="YYYY-MM-DD")
    end_date: str = Field(description="YYYY-MM-DD")

# ✅ SCHEMA MỚI CHO TOOL LỊCH SỬ
class HistoryInput(BaseModel):
    limit: int = Field(default=5, description="Số lượng giao dịch gần nhất cần xem")

# --- HÀM CHÍNH ---
def get_finbot_tools(db: Session, user: user_model.User):
    def find_existing_category(name: str, type: str):
        # (Logic tìm category giữ nguyên)
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

    # --- TOOL 1: GHI CHÉP (ĐÃ SỬA ĐỂ ẨN ID VÀ THÊM REFRESH) ---
    def create_transaction_func(type: str, amount: float, category_name: str, note: str = "", date_str: str = None):
        try:
            clean_type = type.lower().strip()
            dec_amount = Decimal(str(amount))
            txn_date = date.fromisoformat(date_str) if date_str else date.today()

            existing_cat = find_existing_category(category_name, clean_type)
            cat_id = existing_cat.id if existing_cat else None
            final_name = existing_cat.name if existing_cat else category_name
            final_emoji = existing_cat.icon if existing_cat else "🤖"

            if clean_type == "income":
                crud_income.create_income(db, user.id, final_name, dec_amount, user.currency_code or "USD", txn_date,
                                          final_emoji, cat_id)
                # ✅ SỬA: Trả về câu văn thân thiện + Thẻ [REFRESH]
                return f"[REFRESH] ✅ Đã thêm THU NHẬP: {amount:,.0f} vào '{final_name}'."

            elif clean_type == "expense":
                crud_expense.create_expense(db, user.id, final_name, dec_amount, user.currency_code or "USD", txn_date,
                                            final_emoji, cat_id)
                # ✅ SỬA: Trả về câu văn thân thiện + Thẻ [REFRESH]
                return f"[REFRESH] ✅ Đã thêm CHI TIÊU: {amount:,.0f} vào '{final_name}'."

            return "❌ Lỗi loại giao dịch."
        except Exception as e:
            return f"❌ Lỗi: {str(e)}"

    # Tool 5: Xem lịch sử chi tiết (MỚI)
    def get_history_func(limit: int = 5):
        """Lấy danh sách giao dịch gần dây kèm ghi chú để trả lời user"""
        try:
            txs = crud_transaction.get_recent_transactions(db, user.id, limit)
            if not txs: return "Không có giao dịch nào gần đây."

            #Format dữ liệu trả về AI đọc
            result_str = "Lịch sử giao dịch gần nhất:\n"
            for t in txs:
                note_str = f"(Note: {t.note})" if t.note else ""
                result_str += f"- {t.transaction_date}: {t.type.upper()} {t.amount:,.of} - {t.category_name} {note_str} \n"

                return result_str
        except Exception as e: return  f"Lỗi xem lịch sử: {str(e)}"
    # --- TOOL 2: SỐ DƯ ---
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

    # --- TOOL 3: THỐNG KÊ ---
    def get_statistics_func(start_date: str, end_date: str):
        try:
            s_date = date.fromisoformat(start_date)
            e_date = date.fromisoformat(end_date)
            stats = crud_summary.get_period_summary(db, user.id, s_date, e_date)
            return json.dumps(stats, default=str)
        except Exception as e:
            return f"Lỗi: {str(e)}"

    # --- TOOL 4: VẼ BIỂU ĐỒ ---
    def analyze_spending_func(start_date: str, end_date: str):
        try:
            s_date = date.fromisoformat(start_date)
            e_date = date.fromisoformat(end_date)
            breakdown = crud_summary.get_period_breakdown(db, user.id, s_date, e_date)
            if not breakdown: return "Không có dữ liệu."

            chart_data = {"type": "pie", "data": breakdown, "title": f"Chi tiêu {start_date} - {end_date}"}
            # Trả về thẻ CHART_DATA
            return f"[CHART_DATA_START]{json.dumps(chart_data)}[CHART_DATA_END]"
        except Exception as e:
            return f"Lỗi: {str(e)}"

    return [
        StructuredTool.from_function(func=create_transaction_func, name="create_transaction",
                                     description="Ghi chép thu/chi.", args_schema=CreateTransactionInput),
        StructuredTool.from_function(func=get_balance_func, name="get_balance", description="Xem số dư."),
        StructuredTool.from_function(func=get_statistics_func, name="get_statistics", description="Thống kê tổng quan.",
                                     args_schema=DateRangeInput),
        StructuredTool.from_function(func=analyze_spending_func, name="analyze_spending", description="Vẽ biểu đồ.",
                                     args_schema=AnalyzeInput),
        StructuredTool.from_function(func=get_history_func, name="get_history",
                                     description="Xem chi tiết các giao dịch gần đây (có ghi chú).",
                                     args_schema=HistoryInput)
    ]