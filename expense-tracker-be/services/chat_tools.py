# services/chat_tools.py
from langchain_core.tools import tool
from sqlalchemy.orm import Session
from datetime import date
from cruds import crud_income, crud_expense, crud_summary
from models import user_model, category_model  # Import thêm category_model
from sqlalchemy import func


def get_finbot_tools(db: Session, user: user_model.User):
    # ✅ Hàm Helper: Tìm category thông minh (case-insensitive)
    def find_existing_category(name: str, type: str):
        # 1. Tìm trong category của User
        cat = db.query(category_model.Category).filter(
            category_model.Category.user_id == user.id,
            func.lower(category_model.Category.name) == name.lower(),  # So sánh chữ thường
            category_model.Category.type == type
        ).first()
        if cat: return cat

        # 2. Tìm trong category Mặc định (user_id=None)
        cat_default = db.query(category_model.Category).filter(
            category_model.Category.user_id == None,
            func.lower(category_model.Category.name) == name.lower(),  # So sánh chữ thường
            category_model.Category.type == type
        ).first()
        return cat_default

    @tool
    def create_transaction(type: str, amount: float, category_name: str, note: str = ""):
        """
        Tạo giao dịch mới.
        Args:
            type: 'income' hoặc 'expense'.
            amount: Số tiền.
            category_name: Tên danh mục (ví dụ: 'Salary', 'Food').
        """
        try:
            clean_type = type.lower().strip()

            # ✅ BƯỚC QUAN TRỌNG: Tìm category có sẵn trước
            existing_cat = find_existing_category(category_name, clean_type)

            # Nếu tìm thấy, dùng ID và Name chuẩn của nó.
            # Nếu không, để None để CRUD tự tạo mới.
            cat_id = existing_cat.id if existing_cat else None
            final_cat_name = existing_cat.name if existing_cat else category_name
            # Nếu dùng category có sẵn thì KHÔNG dùng icon robot, dùng icon gốc.
            final_emoji = None if existing_cat else "🤖"

            if clean_type == "income":
                crud_income.create_income(
                    db=db,
                    user_id=user.id,
                    category_name=final_cat_name,
                    amount=amount,
                    currency_code=user.currency_code or "USD",
                    date_val=date.today(),
                    emoji=final_emoji,  # Chỉ hiện robot nếu là category mới hoàn toàn
                    category_id=cat_id
                )
                return f"✅ Đã thêm THU NHẬP: {amount:,.0f} vào mục '{final_cat_name}'."

            elif clean_type == "expense":
                crud_expense.create_expense(
                    db=db,
                    user_id=user.id,
                    category_name=final_cat_name,
                    amount=amount,
                    currency_code=user.currency_code or "USD",
                    date_val=date.today(),
                    emoji=final_emoji,
                    category_id=cat_id
                )
                return f"✅ Đã thêm CHI TIÊU: {amount:,.0f} vào mục '{final_cat_name}'."

            else:
                return "❌ Lỗi: Loại giao dịch không hợp lệ."

        except Exception as e:
            return f"❌ Lỗi hệ thống: {str(e)}"

    # ... (tool get_balance giữ nguyên)
    @tool
    def get_balance():
        # ... (giữ nguyên)
        try:
            summary = crud_summary.get_financial_kpi_summary(db, user.id)
            return summary  # Trả về thẳng dict để AI tự format lời nói
        except Exception as e:
            return f"Lỗi: {str(e)}"

        # ✅ TOOL MỚI: Thống kê theo thời gian
    @tool
    def get_statistics(start_date: str, end_date: str):
        """
        Thống kê tổng thu nhập và chi tiêu trong khoảng thời gian.
        Args:
        start_date: Ngày bắt đầu (định dạng 'YYYY-MM-DD').
        end_date: Ngày kết thúc (định dạng 'YYYY-MM-DD').
        Ví dụ: Nếu hỏi 'tháng này', hãy tự tính ngày bắt đầu và kết thúc của tháng hiện tại.
        """
        try:
            # Chuyển đổi string sang date object
            s_date = date.fromisoformat(start_date)
            e_date = date.fromisoformat(end_date)

            stats = crud_summary.get_period_summary(db, user.id, s_date, e_date)

            return {
                "period": f"{start_date} đến {end_date}",
                "income": stats["total_income"],
                "expense": stats["total_expense"],
                "balance": stats["net_balance"],
                "currency": user.currency_symbol or "$"
            }
        except ValueError:
            return "❌ Lỗi: Định dạng ngày tháng không hợp lệ (Yêu cầu YYYY-MM-DD)."
        except Exception as e:
            return f"❌ Lỗi hệ thống: {str(e)}"

        # ✅ NHỚ THÊM get_statistics VÀO LIST TRẢ VỀ



    return [create_transaction, get_balance, get_statistics]