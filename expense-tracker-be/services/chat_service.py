# services/chat_service.py
import os
from datetime import date  # ✅ Import date để lấy ngày hôm nay
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy.orm import Session
from models import user_model
from services.chat_tools import get_finbot_tools

# ✅ CẬP NHẬT SYSTEM PROMPT: Thêm biến {current_date}
SYSTEM_PROMPT = """
Bạn là FinBot, trợ lý tài chính cá nhân thông minh.
Hôm nay là ngày: {current_date}.

NHIỆM VỤ & CÔNG CỤ:
1. **Ghi chép (create_transaction):** Dùng khi người dùng muốn thêm thu/chi. Tự suy luận category.
2. **Số dư hiện tại (get_balance):** Dùng khi hỏi "tôi còn bao nhiêu tiền", "số dư".
3. **Thống kê (get_statistics):** Dùng khi hỏi "tháng này tiêu bao nhiêu", "tuần trước thu nhập thế nào".
   - Bạn PHẢI tự tính toán `start_date` và `end_date` (YYYY-MM-DD) dựa trên ngày hôm nay ({current_date}).
   - Ví dụ: Nếu hôm nay là 2025-11-21 và hỏi "tháng này", start_date='2025-11-01', end_date='2025-11-21'.

QUY TẮC TRẢ LỜI:
- Luôn trả lời ngắn gọn, dùng Emoji vui vẻ.
- Nếu thống kê: Hãy báo cáo rõ Tổng thu, Tổng chi và Số dư trong khoảng đó.
- Luôn dùng Tiếng Việt.
"""


def process_chat_message(db: Session, user: user_model.User, user_message: str):
    # 1. Khởi tạo Gemini (Giữ nguyên)
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0,
    )

    # 2. Chuẩn bị Tools (Giữ nguyên)
    tools = get_finbot_tools(db, user)

    # 3. Tạo Prompt (CÓ CẬP NHẬT BIẾN)
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    # 4. Tạo Agent (Giữ nguyên)
    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    # 5. Chạy (CÓ TRUYỀN NGÀY HÔM NAY)
    try:
        # ✅ Truyền ngày hôm nay vào biến current_date
        today_str = date.today().strftime("%Y-%m-%d")

        result = agent_executor.invoke({
            "input": user_message,
            "current_date": today_str  # <-- FinBot sẽ biết hôm nay là ngày mấy
        })
        return result["output"]
    except Exception as e:
        return f"Xin lỗi, tôi gặp chút trục trặc: {str(e)}"