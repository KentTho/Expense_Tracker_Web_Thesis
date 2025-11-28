# services/chat_service.py (PHIÊN BẢN FULL TÍNH NĂNG)
import os
from datetime import date
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from sqlalchemy.orm import Session
from models import user_model
from services.chat_tools import get_finbot_tools
from cruds.crud_category import get_user_category_names_string


def process_chat_message(db: Session, user: user_model.User, user_message: str, history: list = []):
    # 1. Khởi tạo Gemini
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0,
    )

    # 2. Lấy Tools và Context
    tools = get_finbot_tools(db, user)
    category_context = get_user_category_names_string(db, user.id)

    # Chuẩn bị dữ liệu thời gian
    today = date.today()
    weekday_map = ["Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "Chủ Nhật"]
    weekday_str = weekday_map[today.weekday()]
    is_admin_str = "QUẢN TRỊ VIÊN (ADMIN)" if user.is_admin else "NGƯỜI DÙNG (USER)"

    # 3. Xử lý Admin Block
    ADMIN_BLOCK = ""
    if user.is_admin:
        ADMIN_BLOCK = """
        5. **GIÁM SÁT HỆ THỐNG (AI Ops - Chỉ Admin):**
           - Khi user hỏi "tình hình hệ thống", "số user", "dòng tiền".
           - Dùng tool `get_system_stats`.
        """

    # 4. SYSTEM PROMPT (ĐẦY ĐỦ CÁC TÍNH NĂNG)
    SYSTEM_TEMPLATE = """
    Bạn là FinBot, trợ lý tài chính cá nhân thông minh, quyết đoán.

    # THÔNG TIN NGỮ CẢNH
    - Vai trò user: {user_role}
    - Hôm nay là: {{current_date}} (Thứ {{weekday}}).

    DỮ LIỆU DANH MỤC HIỆN CÓ CỦA NGƯỜI DÙNG:
    {categories}

    # NHIỆM VỤ & CÔNG CỤ (ƯU TIÊN THEO THỨ TỰ):

    1. **GHI CHÉP (create_transaction):**
       - Dùng khi user nói: "vừa ăn 50k", "nhận lương 10tr", "đổ xăng", "mua áo tặng mẹ".
       - **QUY TẮC SUY LUẬN:**
         + Loại: "Ăn, Mua, Tiêu" -> expense. "Lương, Thưởng" -> income.
         + Số tiền: Tự convert "50k"->50000, "1tr"->1000000.
         + Danh mục: Chọn tên khớp nhất trong danh sách trên.
         + **Ghi chú (Note):** Trích xuất chi tiết phụ (VD: "Ăn sáng *với Lan*" -> Note="với Lan").
       - **HÀNH ĐỘNG:** Nếu đủ Tiền + Việc -> GỌI TOOL NGAY. Nếu thiếu -> Hỏi lại ngắn gọn.

    2. **TRA CỨU LỊCH SỬ (get_history):**
       - Dùng khi user hỏi: "hôm qua tiêu gì", "sáng nay làm gì", "check lại giao dịch vừa rồi".
       - Trả lời chi tiết gồm cả Ghi chú (nếu có).

    3. **PHÂN TÍCH & VẼ BIỂU ĐỒ (analyze_spending):**
       - Dùng khi user hỏi: "vẽ biểu đồ", "cơ cấu chi tiêu", "phân tích tháng này".
       - **QUY TẮC KỸ THUẬT:** Giữ nguyên thẻ `[CHART_DATA_START]...[CHART_DATA_END]` trong câu trả lời. Không được xóa hay tóm tắt nó.

    4. **THỐNG KÊ NHANH (get_statistics):**
       - Dùng khi user hỏi tổng quát: "tháng này tiêu bao nhiêu", "tuần trước thu nhập thế nào" (không đòi biểu đồ).
       - TỰ TÍNH NGÀY:
         + "Tháng này": Từ ngày 1 tháng này -> Hôm nay.
         + "Tháng trước": Từ ngày 1 tháng trước -> Ngày cuối tháng trước.
         + "Tuần này": Từ Thứ 2 tuần này -> Hôm nay.

    5. **SỐ DƯ (get_balance):**
       - Dùng khi hỏi "tôi còn bao nhiêu tiền", "số dư".

    {admin_instructions}

    PHONG CÁCH TRẢ LỜI:
    - Ghi chép xong: "✅ Đã thêm [Số tiền] vào [Mục]!" (Ngắn gọn).
    - Biểu đồ: "Đây là biểu đồ chi tiêu của bạn 📊".
    - Luôn dùng Tiếng Việt.
    """

    # Format các biến tĩnh
    formatted_system_prompt = SYSTEM_TEMPLATE.format(
        user_role=is_admin_str,
        categories=category_context,
        admin_instructions=ADMIN_BLOCK
    )

    # 5. Xử lý Lịch sử Chat
    chat_history = []
    recent_history = history[-6:]
    for msg in recent_history:
        if msg['role'] == 'user':
            chat_history.append(HumanMessage(content=msg['content']))
        elif msg['role'] == 'bot':
            clean_content = msg['content'].replace("[REFRESH]", "").split("[CHART_DATA_START]")[0]
            chat_history.append(AIMessage(content=clean_content))

    # 6. Tạo Prompt Template
    prompt = ChatPromptTemplate.from_messages([
        ("system", formatted_system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    # 7. Tạo Agent
    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    # 8. Thực thi
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
        return f"Xin lỗi, hệ thống đang bận: {str(e)}"