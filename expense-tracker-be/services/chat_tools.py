# services/chat_tools.py
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import date
from decimal import Decimal
import json
from cruds import crud_income, crud_expense, crud_summary, crud_transaction, crud_admin, crud_audit, crud_user
from models import user_model, category_model
from sqlalchemy import func
from typing import List

# --- SCHEMAS (Giữ nguyên các schema cũ của User) ---
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


class HistoryInput(BaseModel):
    limit: int = Field(default=5, description="Số lượng")


class SetBudgetInput(BaseModel):
    amount: float = Field(description="Số tiền")


class AdminSearchInput(BaseModel):
    email: str = Field(description="Email user cần tìm")

class BatchTransactionInput(BaseModel):
    transactions: List[CreateTransactionInput] = Field(description="Danh sách các giao dịch cần ghi")

# --- HÀM CHÍNH ---
def get_finbot_tools(db: Session, user: user_model.User):
    # ... (Giữ nguyên logic find_existing_category) ...
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

    # ... (Giữ nguyên các hàm create_transaction, set_budget, get_balance, get_statistics, analyze_spending, get_history) ...
    def create_transaction_func(type, amount, category_name, note="", date_str=None):
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

    def set_budget_func(amount: float):
        try:
            user.monthly_budget = Decimal(str(amount))
            db.commit();
            db.refresh(user)
            return f"[REFRESH] ✅ Đã cập nhật ngân sách: {amount:,.0f}."
        except Exception as e:
            return f"Lỗi: {str(e)}"

    def get_balance_func():
        try:
            summary = crud_summary.get_financial_kpi_summary(db, user.id)
            return {"Thu": float(summary["total_income"]), "Chi": float(summary["total_expense"]),
                    "Dư": float(summary["total_income"] - summary["total_expense"])}
        except Exception as e:
            return f"Lỗi: {str(e)}"

    def get_statistics_func(start_date, end_date):
        try:
            s_date = date.fromisoformat(start_date);
            e_date = date.fromisoformat(end_date)
            stats = crud_summary.get_period_summary(db, user.id, s_date, e_date)
            return json.dumps(stats, default=str)
        except Exception as e:
            return f"Lỗi: {str(e)}"

    def analyze_spending_func(start_date, end_date):
        try:
            s_date = date.fromisoformat(start_date);
            e_date = date.fromisoformat(end_date)
            breakdown = crud_summary.get_period_breakdown(db, user.id, s_date, e_date)
            if not breakdown: return "NO_DATA"
            chart_data = {"type": "pie", "data": breakdown, "title": f"Chi tiêu {start_date} - {end_date}"}
            return f"[CHART_DATA_START]{json.dumps(chart_data)}[CHART_DATA_END]"
        except Exception as e:
            return f"Lỗi: {str(e)}"

    def get_history_func(limit=5):
        try:
            txs = crud_transaction.get_recent_transactions(db, user.id, limit)
            if not txs: return "Không có giao dịch nào."
            res = ""
            for t in txs: res += f"- {t.transaction_date}: {t.type} {t.amount:,.0f} ({t.category_name}) Note: {t.note}\n"
            return res
        except Exception as e:
            return f"Lỗi: {str(e)}"

    def create_batch_transactions_func(transactions: List[CreateTransactionInput]):
        results = []
        try:
            for item in transactions:
                # Gọi lại logic của hàm đơn lẻ để tái sử dụng code
                res = create_transaction_func(
                    type=item.type,
                    amount=item.amount,
                    category_name=item.category_name,
                    note=item.note,
                    date_str=item.date_str
                )
                results.append(res)

            # Trả về 1 chuỗi kết quả duy nhất
            return f"[REFRESH] ✅ Đã ghi nhận {len(results)} giao dịch:\n- " + "\n- ".join(results)
        except Exception as e:
            return f"❌ Lỗi ghi hàng loạt: {str(e)}"

    # ==========================================
    # 🛡️ ADMIN TOOLS (MỚI & XỊN)
    # ==========================================

    # 1. Lấy thống kê hệ thống THẬT
    def get_admin_kpi_func():
        try:
            kpis = crud_admin.admin_get_global_kpis(db)
            # Trả về JSON thuần để FE render thẻ đẹp
            data = {
                "users": kpis['total_users'],
                "income": float(kpis['total_income']),
                "expense": float(kpis['total_expense']),
                "balance": float(kpis['net_balance']),
                "2fa": kpis.get('total_2fa_users', 0),
                "new_users": kpis.get('new_users_24h', 0)
            }
            return f"Tình hình hệ thống hiện tại:\n[ADMIN_KPI_DATA]{json.dumps(data)}[/ADMIN_KPI_DATA]"
        except Exception as e: return f"Lỗi: {e}"

    # 2. Xem Log hệ thống (Ai vừa làm gì?)
    def get_admin_logs_func(limit: int = 5):
        try:
            logs = crud_audit.get_audit_logs(db, limit=limit)
            if not logs: return "Không có nhật ký nào."

            data = []
            for log in logs:
                data.append({
                    "time": log.created_at.strftime("%H:%M %d/%m"),
                    "admin": log.actor_email,
                    "action": log.action,
                    "status": log.status,
                    "details": log.details
                })
            return f"Các hoạt động gần đây:\n[ADMIN_LOGS_DATA]{json.dumps(data)}[/ADMIN_LOGS_DATA]"
        except Exception as e:
            return f"Lỗi: {e}"

    # 3. Tra cứu thông tin User bất kỳ
    def admin_search_user_func(email: str):
        try:
            target = crud_user.get_user_by_email(db, email)
            if not target: return f"Không tìm thấy user {email}."

            data = {
                "id": str(target.id),
                "name": target.name or "No Name",
                "email": target.email,
                "role": "Admin" if target.is_admin else "User",
                "status": "Active",  # Có thể thêm logic check ban sau này
                "joined": target.created_at.strftime("%d/%m/%Y"),
                "2fa_status": "Enabled" if target.is_2fa_enabled else "Disabled"
            }
            return f"Thông tin người dùng:\n[ADMIN_USER_DATA]{json.dumps(data)}[/ADMIN_USER_DATA]"
        except Exception as e:
            return f"Lỗi: {e}"

    # --- DANH SÁCH TOOLS CHUNG ---
    user_tools = [
        StructuredTool.from_function(func=create_transaction_func, name="create_transaction",
                                     description="Ghi chép thu/chi.", args_schema=CreateTransactionInput),
        StructuredTool.from_function(func=create_batch_transactions_func, name="create_batch_transactions",
                                     description="Dùng khi user muốn ghi NHIỀU khoản thu/chi cùng lúc (Ví dụ: 'ăn 50k và uống 20k').",
                                     args_schema=BatchTransactionInput),
        StructuredTool.from_function(func=set_budget_func, name="set_budget", description="Cài ngân sách.",
                                     args_schema=SetBudgetInput),
        StructuredTool.from_function(func=get_balance_func, name="get_balance", description="Xem số dư."),
        StructuredTool.from_function(func=get_statistics_func, name="get_statistics", description="Thống kê.",
                                     args_schema=DateRangeInput),
        StructuredTool.from_function(func=analyze_spending_func, name="analyze_spending", description="Vẽ biểu đồ.",
                                     args_schema=AnalyzeInput),
        StructuredTool.from_function(func=get_history_func, name="get_history", description="Xem lịch sử.",
                                     args_schema=HistoryInput)
    ]

    # ✅ KÍCH HOẠT TOOLS ADMIN NẾU CÓ QUYỀN
    admin_tools = []
    if user.is_admin:
        admin_tools = [
            StructuredTool.from_function(func=get_admin_kpi_func, name="get_system_stats",
                                         description="Admin: Xem tổng quan KPI hệ thống."),
            StructuredTool.from_function(func=get_admin_logs_func, name="get_system_logs",
                                         description="Admin: Xem nhật ký hoạt động."),
            StructuredTool.from_function(func=admin_search_user_func, name="check_user_info",
                                         description="Admin: Tra cứu user theo email.", args_schema=AdminSearchInput)
        ]

    return user_tools + admin_tools