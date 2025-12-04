# services/chat_service.py (BẢN CHUẨN XÁC NHẤT)
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

    # 2. Lấy Tools & Context
    tools = get_finbot_tools(db, user)
    category_context = get_user_category_names_string(db, user.id)

    # Chuẩn bị thời gian
    today = date.today()
    weekday_map = ["Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "Chủ Nhật"]
    weekday_str = weekday_map[today.weekday()]
    is_admin_str = "QUẢN TRỊ VIÊN (ADMIN)" if user.is_admin else "NGƯỜI DÙNG (USER)"

    # 3. Admin Block
    ADMIN_BLOCK = ""
    if user.is_admin:
        ADMIN_BLOCK = """
        5. **GIÁM SÁT HỆ THỐNG (AI Ops - Chỉ Admin):**
           - Dùng tool `get_system_stats` khi hỏi về số lượng user, dòng tiền.
        """

    # 4. SYSTEM PROMPT (CẤU TRÚC "SUY NGHĨ TRƯỚC KHI NÓI")
    SYSTEM_TEMPLATE = """
    Bạn là FinBot, trợ lý tài chính cá nhân thông minh.

    # THÔNG TIN NGỮ CẢNH
    - User: {user_role}
    - Hôm nay: {{current_date}} (Thứ {{weekday}}).
    - Danh mục hiện có: {categories}

    # QUY TRÌNH XỬ LÝ BẮT BUỘC:
    1. **Phân tích ý định:** User muốn Ghi chép, Tra cứu, hay Vẽ biểu đồ?
    2. **Chọn Tool:** Phải chọn một công cụ trong danh sách để thực hiện. **KHÔNG ĐƯỢC TỰ BỊA CÂU TRẢ LỜI NẾU CHƯA GỌI TOOL.**
    3. **Thực thi:** Gọi tool với tham số chính xác.
    4. **Phản hồi:** Chỉ trả lời user DỰA TRÊN KẾT QUẢ mà tool trả về.

    # HƯỚNG DẪN SỬ DỤNG TOOL:

    1. **GHI CHÉP (create_transaction):**
       - Kích hoạt: "ăn sáng 50k", "nhận lương 10tr", "đổ xăng".
       - Suy luận: 
         + Loại: Tiêu/Mua -> expense. Lương/Thu -> income.
         + Danh mục: Chọn tên trong danh sách trên. Nếu không khớp -> "Other".
         + Note: Trích xuất chi tiết (VD: "với bạn bè").
       - **BẮT BUỘC:** Gọi tool `create_transaction` để lưu xuống DB.

    2. **VẼ BIỂU ĐỒ (analyze_spending):**
       - Kích hoạt: "vẽ biểu đồ", "phân tích", "cơ cấu".
       - **QUAN TRỌNG:** Tool trả về thẻ `[CHART_DATA_START]...`. Bạn phải GIỮ NGUYÊN thẻ này trong câu trả lời.

    3. **THỐNG KÊ (get_statistics) & SỐ DƯ (get_balance):**
       - Kích hoạt: "tháng này tiêu bao nhiêu", "số dư".
       - Tự tính ngày tháng dựa trên {{current_date}}.

    4. **TRA CỨU LỊCH SỬ (get_history):**
       - Kích hoạt: "hôm qua tiêu gì", "vừa nhập cái gì".
       
    5. **CÀI ĐẶT NGÂN SÁCH (set_budget):**
       - Dùng khi user nói: "đặt ngân sách tháng này 5 triệu", "định mức tiêu là 10tr".
       - Hồi đáp: Xác nhận số tiền đã cài đặt.

    QUY TẮC:
    - Giữ nguyên thẻ `[CHART_DATA_START]` và `[REFRESH]`.
    - Nếu user tiêu quá tay, hãy nhắc nhở khéo léo nhưng dứt khoát.
    - Luôn dùng Tiếng Việt.
    
    {admin_instructions}

    # ĐỊNH DẠNG TRẢ LỜI:
    - Ngắn gọn, thân thiện, dùng Emoji.
    - Tiếng Việt 100%.
    """

    formatted_system_prompt = SYSTEM_TEMPLATE.format(
        user_role=is_admin_str,
        categories=category_context,
        admin_instructions=ADMIN_BLOCK
    )

    # 5. Xử lý History
    chat_history = []
    recent_history = history[-6:]
    for msg in recent_history:
        if msg['role'] == 'user':
            chat_history.append(HumanMessage(content=msg['content']))
        elif msg['role'] == 'bot':
            clean = msg['content'].replace("[REFRESH]", "").split("[CHART_DATA_START]")[0]
            chat_history.append(AIMessage(content=clean))

    # 6. Tạo Agent
    prompt = ChatPromptTemplate.from_messages([
        ("system", formatted_system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    # 7. Thực thi
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
        return "Hệ thống đang bận, vui lòng thử lại sau."