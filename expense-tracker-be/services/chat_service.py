# services/chat_service.py
import os
from datetime import date
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder # ✅ Import mới
from langchain_core.messages import HumanMessage, AIMessage # ✅ Import mới
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

    today = date.today()
    weekday_map = ["Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "Chủ Nhật"]
    weekday_str = weekday_map[today.weekday()]
    is_admin_str = "QUẢN TRỊ VIÊN (ADMIN)" if user.is_admin else "NGƯỜI DÙNG (USER)"

    # 3. ADMIN BLOCK
    ADMIN_BLOCK = ""
    if user.is_admin:
        ADMIN_BLOCK = """
    --- KHU VỰC DÀNH RIÊNG CHO ADMIN ---
    5. **GIÁM SÁT HỆ THỐNG (AI Ops):**
       - Khi user hỏi: "tình hình hệ thống", "số lượng user", "dòng tiền".
       - Gọi tool: `get_system_stats`.
       - Báo cáo ngắn gọn, chuyên nghiệp.
    """

    # 4. SYSTEM PROMPT (Giữ nguyên logic của bạn, thêm chỉ dẫn về Context)
    SYSTEM_PROMPT = f"""
    Bạn là **FinBot** — Trợ lý tài chính cá nhân thông minh.

    # THÔNG TIN NGỮ CẢNH
    - Vai trò: **{is_admin_str}** ({user.email})
    - Hôm nay: **{today.strftime("%Y-%m-%d")}** (Thứ {weekday_str}).
    - Danh mục hiện có: [{category_context}]

    # CHIẾN LƯỢC HÀNH VI (Ưu tiên từ trên xuống)

    1. **GHI CHÉP GIAO DỊCH (create_transaction)**
       - **Kích hoạt:** User nói: "Tiền lương 10tr", "Ăn sáng 30k", "Đổ xăng 50k".
       - **QUAN TRỌNG:** Nếu người dùng đang trả lời câu hỏi trước đó của bạn (ví dụ bạn vừa hỏi "Chi vào việc gì?"), hãy ghép nối thông tin đó để thực hiện lệnh.
       - **Quy tắc:**
         + Số tiền: "50k"->50000, "1tr"->1000000.
         + Loại: "Lương/Thưởng" -> income. "Mua/Ăn/Tiêu" -> expense.
         + Danh mục: Tự map theo danh sách trên. Nếu không khớp -> Chọn "Other".
       - **Phản hồi:** "✅ Đã thêm [Số tiền] vào [Tên danh mục]!. Gõ 'hoàn tác' nếu nhầm."

    2. **HOÀN TÁC (delete_transaction)**
       - **Kích hoạt:** "hoàn tác", "xóa giao dịch vừa rồi".

    3. **PHÂN TÍCH & BIỂU ĐỒ (analyze_spending)**
       - **Kích hoạt:** "vẽ biểu đồ", "phân tích", "cơ cấu chi tiêu".
       - **QUY TẮC KỸ THUẬT (QUAN TRỌNG):** Tool sẽ trả về dữ liệu JSON. Bạn phải giữ nguyên JSON đó và kẹp giữa hai thẻ sau:
         [CHART_DATA_START] ...JSON_DATA_TỪ_TOOL... [CHART_DATA_END]

    4. **THỐNG KÊ & SỐ DƯ (get_statistics, get_balance)**
       - **Kích hoạt:** "tháng này tiêu bao nhiêu", "số dư".

    {ADMIN_BLOCK}

    # GIAO TIẾP
    - Tiếng Việt 100%.
    - Thân thiện, dùng emoji (💰, 📊).
    """

    # 5. Xử lý Lịch sử Chat (Convert từ JSON FE sang LangChain Message)
    chat_history = []
    # Lấy tối đa 6 tin nhắn gần nhất để tiết kiệm token nhưng đủ ngữ cảnh
    recent_history = history[-6:]
    for msg in recent_history:
        if msg['role'] == 'user':
            chat_history.append(HumanMessage(content=msg['content']))
        elif msg['role'] == 'bot':
            # Loại bỏ các thẻ kỹ thuật khỏi lịch sử để tránh nhiễu
            clean_content = msg['content'].replace("[REFRESH]", "").split("[CHART_DATA_START]")[0]
            chat_history.append(AIMessage(content=clean_content))

    # 6. Tạo Prompt Template (Có chỗ chứa history)
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="chat_history"), # ✅ Chỗ để nhét lịch sử
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    try:
        result = agent_executor.invoke({
            "input": user_message,
            "chat_history": chat_history # ✅ Truyền lịch sử vào
        })
        return result["output"]
    except Exception as e:
        print(f"❌ Chatbot Error: {str(e)}")
        return "Xin lỗi, tôi đang gặp chút sự cố. Bạn thử lại nhé!"