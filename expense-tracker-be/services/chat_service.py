# services/chat_service.py
import os
from datetime import date
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from sqlalchemy.orm import Session
from models import user_model
from services.chat_tools import get_finbot_tools
from cruds.crud_category import get_user_category_names_string

try:
    from langchain.agents import AgentExecutor, create_tool_calling_agent
except ImportError:
    try:
        from langchain.agents.agent import AgentExecutor
        from langchain.agents import create_tool_calling_agent
    except ImportError:
        from langchain.agents import AgentExecutor
        from langchain.agents.tool_calling_agent.base import create_tool_calling_agent

def process_chat_message(db: Session, user: user_model.User, user_message: str, history: list = []):
    # 1. Khởi tạo Gemini
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=0,
    )

    # 2. Lấy Tools & Context
    tools = get_finbot_tools(db, user)
    category_context = get_user_category_names_string(db, user.id)

    # Chuẩn bị thời gian
    today = date.today()
    weekday_map = ["Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "Chủ Nhật"]
    weekday_str = weekday_map[today.weekday()]
    is_admin_str = "QUẢN TRỊ VIÊN (ADMIN)" if user.is_admin else "NGƯỜI DÙNG (USER)"

    # ✅ NÂNG CẤP KHU VỰC ADMIN
    admin_str = ""
    if user.is_admin:
        admin_str = """
        6. **QUẢN TRỊ VIÊN (Admin Mode):**
           - **Tổng quan:** Hỏi "tình hình hệ thống", "số liệu toàn sàn" -> Dùng `admin_get_kpi`.
           - **Giám sát:** Hỏi "ai vừa làm gì", "xem log", "nhật ký" -> Dùng `admin_get_logs`.
           - **Tra cứu:** Hỏi "check user A", "tìm thông tin email B" -> Dùng `admin_search_user`.
        """

    # 3. SYSTEM PROMPT (BẢN ĐẦY ĐỦ NHẤT)
    SYSTEM_TEMPLATE = """
    Bạn là FinBot, trợ lý tài chính cá nhân thông minh và tận tụy.

    # THÔNG TIN NGỮ CẢNH
    - Hôm nay: {{current_date}} (Thứ {{weekday}}).
    - Danh mục hiện có: {categories}

    # NHIỆM VỤ & CÔNG CỤ (HÃY CHỌN TOOL PHÙ HỢP):

    1. **GHI CHÉP (create_transaction):**
       - Dùng khi user nói: "vừa ăn 50k", "nhận lương 10tr", "mua áo tặng mẹ".
       - **TỰ ĐỘNG:** Suy luận Loại, Số tiền, Danh mục (khớp danh sách).
       - **GHI CHÚ:** Trích xuất chi tiết phụ (VD: "tặng mẹ") vào tham số `note`.

    2. **CÀI ĐẶT NGÂN SÁCH (set_budget):**
       - Dùng khi user nói: "đặt ngân sách tháng này 5 triệu", "định mức tiêu là 10tr".
       - Bot trả lời xác nhận số tiền đã cài.

    3. **TRA CỨU LỊCH SỬ (get_history):**
       - Dùng khi user hỏi: "hôm qua tiêu gì", "sáng nay làm gì", "vừa nhập cái gì", "check lại 3 giao dịch cuối".
       - Tool sẽ trả về danh sách chi tiết (ngày, tiền, note). Hãy đọc nó và báo cáo lại cho user.

    4. **PHÂN TÍCH & VẼ BIỂU ĐỒ (analyze_spending):**
       - Dùng khi user hỏi: "vẽ biểu đồ", "cơ cấu chi tiêu", "xem thống kê dạng biểu đồ".
       - **QUY TẮC TUYỆT ĐỐI:** Tool trả về thẻ `[CHART_DATA_START]...`. Bạn phải giữ nguyên thẻ này trong câu trả lời. Không được xóa, không được bọc trong markdown code block.

    5. **THỐNG KÊ (get_statistics) & SỐ DƯ (get_balance):**
       - Dùng khi hỏi tổng quát: "tháng này tiêu bao nhiêu", "số dư", "tổng kết tuần trước".
       - TỰ TÍNH NGÀY:
         + "Tháng này": Từ ngày 1 tháng này -> Hôm nay.
         + "Tháng trước": Từ ngày 1 tháng trước -> Ngày cuối tháng trước.
         + "Hôm qua": Ngày hôm nay trừ 1.

    {admin_instructions}

    # PHONG CÁCH TRẢ LỜI:
    - Nếu tool trả về cảnh báo (⚠️): Hãy lặp lại cảnh báo đó.
    - Nếu user hỏi lịch sử: Hãy liệt kê rõ ràng từng khoản (Ngày - Mục - Tiền - Note).
    - Luôn vui vẻ, Tiếng Việt.
    """

    formatted_system_prompt = SYSTEM_TEMPLATE.format(
        categories=category_context,
        admin_instructions=admin_str
    )

    # 4. History
    chat_history = []
    recent_history = history[-6:]
    for msg in recent_history:
        if msg['role'] == 'user':
            chat_history.append(HumanMessage(content=msg['content']))
        elif msg['role'] == 'bot':
            clean = msg['content'].replace("[REFRESH]", "").split("[CHART_DATA_START]")[0]
            chat_history.append(AIMessage(content=clean))

    # 5. Create Agent
    prompt = ChatPromptTemplate.from_messages([
        ("system", formatted_system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    # 6. Execute
    try:
        result = agent_executor.invoke({
            "input": user_message,
            "chat_history": chat_history,
            "current_date": today.strftime("%Y-%m-%d"),
            "weekday": weekday_str
        })
        return result["output"]
    except Exception as e:
        print(f"❌ Chatbot Error: {str(e)}")
        return "Xin lỗi, hệ thống đang bận."