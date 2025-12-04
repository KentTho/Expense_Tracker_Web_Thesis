# services/chat_tools.py (BẢN NÂNG CẤP CẢNH BÁO NGÂN SÁCH)
from langchain_core.tools import StructuredTool
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


# ✅ SCHEMA MỚI: Đặt ngân sách
class SetBudgetInput(BaseModel):
    amount: float = Field(description="Số tiền giới hạn chi tiêu cho tháng này")


# ... (Các schema khác giữ nguyên) ...
class DateRangeInput(BaseModel):
    start_date: str = Field(description="YYYY-MM-DD")
    end_date: str = Field(description="YYYY-MM-DD")


class AnalyzeInput(BaseModel):
    start_date: str = Field(description="YYYY-MM-DD")
    end_date: str = Field(description="YYYY-MM-DD")


class HistoryInput(BaseModel):
    limit: int = Field(default=5, description="Số lượng")


# --- HÀM CHÍNH ---
def get_finbot_tools(db: Session, user: user_model.User):
    # Helper check ngân sách (Logic thông minh)
    def check_budget_alert(current_expense_amount: Decimal):
        if not user.monthly_budget or user.monthly_budget <= 0:
            return ""  # Chưa cài ngân sách thì thôi

        # Tính tổng chi tiêu tháng này
        today = date.today()
        start_of_month = date(today.year, today.month, 1)

        total_expense_month = db.query(func.sum(crud_expense.expense_model.Expense.amount)).filter(
            crud_expense.expense_model.Expense.user_id == user.id,
            crud_expense.expense_model.Expense.date >= start_of_month
        ).scalar() or Decimal(0)

        # Cộng thêm khoản vừa chi (vì DB có thể chưa kịp commit transaction hiện tại trong session này)
        # Hoặc nếu đã commit rồi thì total_expense_month đã bao gồm.
        # Ở đây giả định hàm create_expense đã commit, nên total_expense_month là tổng thực tế.

        limit = user.monthly_budget
        if total_expense_month > limit:
            over = total_expense_month - limit
            return f"\n⚠️ CẢNH BÁO: Bạn đã tiêu {total_expense_month:,.0f}đ. Vượt ngân sách {limit:,.0f}đ là {over:,.0f}đ!"
        elif total_expense_month > (limit * Decimal("0.9")):
            return f"\n⚠️ CẢNH BÁO: Bạn đã tiêu {total_expense_month:,.0f}đ. Sắp hết ngân sách {limit:,.0f}đ rồi!"
        return ""

    # --- TOOL 0: CÀI ĐẶT NGÂN SÁCH (MỚI) ---
    def set_budget_func(amount: float):
        try:
            user.monthly_budget = Decimal(str(amount))
            db.commit()
            db.refresh(user)
            return f"✅ Đã cập nhật ngân sách tháng này là: {amount:,.0f} VNĐ. Tôi sẽ nhắc nhở nếu bạn tiêu quá lố."
        except Exception as e:
            return f"Lỗi cài đặt: {str(e)}"

    # --- TOOL 1: GHI CHÉP (CẬP NHẬT CẢNH BÁO) ---
    def create_transaction_func(type: str, amount: float, category_name: str, note: str = "", date_str: str = None):
        try:
            clean_type = type.lower().strip()
            dec_amount = Decimal(str(amount))
            txn_date = date.fromisoformat(date_str) if date_str else date.today()

            # (Logic tìm category giữ nguyên - rút gọn cho ngắn)
            # ... bạn copy lại đoạn logic find_existing_category ở đây ...
            # Để code ngắn gọn, tôi giả định bạn giữ nguyên đoạn tìm category cũ
            cat_default = db.query(category_model.Category).filter(
                category_model.Category.user_id == None,
                func.lower(category_model.Category.name) == category_name.lower().strip(),
                category_model.Category.type == type).first()
            cat_id = cat_default.id if cat_default else None
            final_name = cat_default.name if cat_default else category_name
            final_emoji = cat_default.icon if cat_default else "🤖"

            alert_msg = ""

            if clean_type == "income":
                crud_income.create_income(db, user.id, final_name, dec_amount, "USD", txn_date, final_emoji, cat_id,
                                          note=note)
                return f"[REFRESH] ✅ Đã thêm THU NHẬP: {amount:,.0f}."

            elif clean_type == "expense":
                crud_expense.create_expense(db, user.id, final_name, dec_amount, "USD", txn_date, final_emoji, cat_id,
                                            note=note)

                # ✅ KIỂM TRA NGÂN SÁCH SAU KHI CHI TIÊU
                alert_msg = check_budget_alert(dec_amount)

                return f"[REFRESH] ✅ Đã thêm CHI TIÊU: {amount:,.0f} vào '{final_name}'. {alert_msg}"

            return "❌ Lỗi loại giao dịch."
        except Exception as e:
            return f"❌ Lỗi: {str(e)}"

    # ... (Các tool get_balance, get_statistics, analyze_spending, get_history GIỮ NGUYÊN) ...
    # ... Bạn nhớ copy lại đầy đủ các hàm cũ nhé ...
    # Ở đây tôi viết tóm tắt để bạn dễ nhìn phần thay đổi
    def get_balance_func():
        return "Balance Info"  # Placeholder

    def get_statistics_func(start_date, end_date):
        return "Stats Info"  # Placeholder

    def analyze_spending_func(start_date, end_date):
        return "Chart Data"  # Placeholder

    def get_history_func(limit):
        return "History Data"  # Placeholder

    # LIST TOOLS
    return [
        StructuredTool.from_function(func=create_transaction_func, name="create_transaction",
                                     description="Ghi chép thu/chi.", args_schema=CreateTransactionInput),
        # ✅ Đăng ký tool mới
        StructuredTool.from_function(func=set_budget_func, name="set_budget",
                                     description="Cài đặt ngân sách/định mức chi tiêu cho tháng.",
                                     args_schema=SetBudgetInput),

        # Các tool cũ
        StructuredTool.from_function(func=get_balance_func, name="get_balance", description="Xem số dư."),
        StructuredTool.from_function(func=get_statistics_func, name="get_statistics", description="Thống kê.",
                                     args_schema=DateRangeInput),
        StructuredTool.from_function(func=analyze_spending_func, name="analyze_spending", description="Vẽ biểu đồ.",
                                     args_schema=AnalyzeInput),
        StructuredTool.from_function(func=get_history_func, name="get_history", description="Xem lịch sử.",
                                     args_schema=HistoryInput)
    ]