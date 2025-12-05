# services/chat_tools.py (BẢN FIX: THÊM SET BUDGET)
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import date
from decimal import Decimal
from cruds import crud_income, crud_expense, crud_summary, crud_transaction
from models import user_model, category_model
from sqlalchemy import func
import json


# --- 1. SCHEMAS ---
class CreateTransactionInput(BaseModel):
    type: str = Field(description="Loại: 'income' hoặc 'expense'")
    amount: float = Field(description="Số tiền (VNĐ)")
    category_name: str = Field(description="Tên danh mục")
    note: str = Field(default="", description="Ghi chú chi tiết")
    date_str: str = Field(default=None, description="Ngày (YYYY-MM-DD)")


class DateRangeInput(BaseModel):
    start_date: str = Field(description="YYYY-MM-DD")
    end_date: str = Field(description="YYYY-MM-DD")


class AnalyzeInput(BaseModel):
    start_date: str = Field(description="YYYY-MM-DD")
    end_date: str = Field(description="YYYY-MM-DD")


class HistoryInput(BaseModel):
    limit: int = Field(default=5, description="Số lượng")


# ✅ SCHEMA MỚI CHO NGÂN SÁCH
class SetBudgetInput(BaseModel):
    amount: float = Field(description="Số tiền giới hạn chi tiêu cho tháng này (VNĐ)")


# --- 2. HÀM CHÍNH ---
def get_finbot_tools(db: Session, user: user_model.User):
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

    # TOOL 1: GHI CHÉP
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
                                          final_emoji, cat_id, note=note)
                return f"[REFRESH] ✅ Đã thêm THU NHẬP: {amount:,.0f} ({final_name}). Ghi chú: {note}"
            elif clean_type == "expense":
                crud_expense.create_expense(db, user.id, final_name, dec_amount, user.currency_code or "USD", txn_date,
                                            final_emoji, cat_id, note=note)
                return f"[REFRESH] ✅ Đã thêm CHI TIÊU: {amount:,.0f} ({final_name}). Ghi chú: {note}"
            return "❌ Lỗi loại giao dịch."
        except Exception as e:
            return f"❌ Lỗi: {str(e)}"

    # ✅ TOOL 2: CÀI ĐẶT NGÂN SÁCH (QUAN TRỌNG)
    def set_budget_func(amount: float):
        try:
            # Cập nhật trực tiếp vào User Model
            user.monthly_budget = Decimal(str(amount))
            db.commit()
            db.refresh(user)
            return f"[REFRESH] ✅ Đã cập nhật ngân sách tháng này thành: {amount:,.0f} VNĐ. Tôi sẽ cảnh báo nếu bạn tiêu quá tay!"
        except Exception as e:
            return f"❌ Lỗi cài đặt ngân sách: {str(e)}"

    # TOOL 3: SỐ DƯ
    def get_balance_func():
        try:
            summary = crud_summary.get_financial_kpi_summary(db, user.id)
            return {"Thu": float(summary["total_income"]), "Chi": float(summary["total_expense"]),
                    "Dư": float(summary["total_income"] - summary["total_expense"])}
        except Exception as e:
            return f"Lỗi: {str(e)}"

    # TOOL 4: THỐNG KÊ
    def get_statistics_func(start_date: str, end_date: str):
        try:
            s_date = date.fromisoformat(start_date);
            e_date = date.fromisoformat(end_date)
            stats = crud_summary.get_period_summary(db, user.id, s_date, e_date)
            return json.dumps(stats, default=str)
        except Exception as e:
            return f"Lỗi: {str(e)}"

    # TOOL 5: VẼ BIỂU ĐỒ
    def analyze_spending_func(start_date: str, end_date: str):
        try:
            s_date = date.fromisoformat(start_date);
            e_date = date.fromisoformat(end_date)
            breakdown = crud_summary.get_period_breakdown(db, user.id, s_date, e_date)
            if not breakdown: return "NO_DATA"

            chart_data = {"type": "pie", "data": breakdown, "title": f"Chi tiêu {start_date} - {end_date}"}
            return f"[CHART_DATA_START]{json.dumps(chart_data)}[CHART_DATA_END]"
        except Exception as e:
            return f"Lỗi: {str(e)}"

    # TOOL 6: LỊCH SỬ
    def get_history_func(limit: int = 5):
        try:
            txs = crud_transaction.get_recent_transactions(db, user.id, limit)
            if not txs: return "Không có giao dịch nào."
            res = "Lịch sử:\n"
            for t in txs: res += f"- {t.transaction_date}: {t.type} {t.amount:,.0f} ({t.category_name}) Note: {t.note}\n"
            return res
        except Exception as e:
            return f"Lỗi: {str(e)}"

    # --- DANH SÁCH TOOLS TRẢ VỀ (Đủ 6 món) ---
    tools = [
        StructuredTool.from_function(func=create_transaction_func, name="create_transaction",
                                     description="Ghi chép thu/chi.", args_schema=CreateTransactionInput),
        # ✅ Đã thêm lại set_budget
        StructuredTool.from_function(func=set_budget_func, name="set_budget",
                                     description="Cài đặt ngân sách chi tiêu tháng.", args_schema=SetBudgetInput),
        StructuredTool.from_function(func=get_balance_func, name="get_balance", description="Xem số dư."),
        StructuredTool.from_function(func=get_statistics_func, name="get_statistics", description="Thống kê tổng quan.",
                                     args_schema=DateRangeInput),
        StructuredTool.from_function(func=analyze_spending_func, name="analyze_spending", description="Vẽ biểu đồ.",
                                     args_schema=AnalyzeInput),
        StructuredTool.from_function(func=get_history_func, name="get_history", description="Xem lịch sử.",
                                     args_schema=HistoryInput)
    ]

    if user.is_admin:
        def get_admin_stats(): return "System OK"

        tools.append(
            StructuredTool.from_function(func=get_admin_stats, name="get_system_stats", description="Admin Stats"))

    return tools