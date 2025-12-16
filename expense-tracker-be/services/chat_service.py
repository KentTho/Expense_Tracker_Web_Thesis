import os
from datetime import date

# 1. Import AI Core
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

# 2. ✅ IMPORT CHUẨN CHO LANGCHAIN 0.3 (QUAN TRỌNG NHẤT)
from langchain.agents import AgentExecutor, create_tool_calling_agent

# 3. Import Internal Modules
from sqlalchemy.orm import Session
from models import user_model
from services.chat_tools import get_finbot_tools
from cruds.crud_category import get_user_category_names_string


def process_chat_message(db: Session, user: user_model.User, user_message: str, history: list = []):
    """
    Hàm xử lý tin nhắn Chatbot chính:
    1. Khởi tạo LLM (Gemini)
    2. Chuẩn bị Tools & Context
    3. Xây dựng System Prompt
    4. Gọi Agent thực thi
    """

    # --- 1. Khởi tạo Gemini Model ---
    # API Key tự động lấy từ biến môi trường GOOGLE_API_KEY
    llm = ChatGoogleGenerativeAI(
        model="gemini-flash-lite-latest",
        temperature=0,  # Nhiệt độ 0 để câu trả lời chính xác, ít sáng tạo linh tinh
    )

    # 2. Lấy Tools & Context
    tools = get_finbot_tools(db, user)
    category_context = get_user_category_names_string(db, user.id)

    # Chuẩn bị thời gian
    today = date.today()
    weekday_map = ["Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "Chủ Nhật"]
    weekday_str = weekday_map[today.weekday()]

    # ✅ NÂNG CẤP KHU VỰC ADMIN
    admin_str = ""
    if user.is_admin:
        admin_str = """
                7. **QUẢN TRỊ VIÊN (Admin Mode):**
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
            6. **TƯ VẤN TÀI CHÍNH (financial_advice) - [MỚI]:**
               - Dùng khi user hỏi: "tôi tiêu thế này có ổn không?", "gợi ý cách tiết kiệm", "đánh giá chi tiêu tháng này".
               - **HÀNH ĐỘNG:** Trước khi trả lời, hãy TỰ ĐỘNG gọi tool `get_statistics` hoặc `get_balance` để xem tình hình tài chính hiện tại của user.
               - **NỘI DUNG TƯ VẤN:** Dựa trên số liệu, hãy đưa ra lời khuyên ngắn gọn (Ví dụ: "Bạn đã tiêu 80% ngân sách cho Ăn uống, nên cắt giảm bớt trà sữa nhé" hoặc gợi ý quy tắc 50/30/20).
            
            {admin_instructions}

            # ⚠️ QUY TẮC XỬ LÝ HỘI THOẠI (BẮT BUỘC TUÂN THỦ):
            - **ƯU TIÊN HOÀN THÀNH TÁC VỤ CŨ:** Nếu ở lượt chat trước bạn đang hỏi user thông tin còn thiếu (ví dụ: "Ngày nào?", "Ghi chú là gì?"), và user trả lời (ví dụ: "2024-12-03", "hôm nay"), bạn phải DÙNG thông tin đó để GỌI NGAY tool `create_transaction`.
            - **KHÔNG LẠC ĐỀ:** TUYỆT ĐỐI KHÔNG tự ý chuyển sang tool Thống kê (`get_statistics`) hay Lịch sử (`get_history`) khi user chỉ cung cấp ngày tháng để hoàn thiện giao dịch ghi chép.
            - **Logic:** Thấy ngày tháng -> Kiểm tra xem có giao dịch nào đang chờ ngày không -> Nếu có: Điền vào và Lưu. Nếu không: Mới được tra cứu.

            # PHONG CÁCH TRẢ LỜI:
            - Nếu tool trả về cảnh báo (⚠️): Hãy lặp lại cảnh báo đó.
            - Nếu user hỏi lịch sử: Hãy liệt kê rõ ràng từng khoản (Ngày - Mục - Tiền - Note).
            - Luôn vui vẻ, Tiếng Việt.
            - QUAN TRỌNG: Nếu vừa thực hiện công cụ "create_transaction" (Ghi chép) thành công, hãy thêm thẻ `[REFRESH]` vào cuối câu trả lời để giao diện cập nhật số dư.
            """

    # Format Prompt lần 1 (Điền thông tin tĩnh)
    formatted_system_prompt = SYSTEM_TEMPLATE.format(
        categories=category_context,
        admin_instructions=admin_str
    )

    # --- 5. Xử lý Lịch sử Chat (Context Window) ---
    chat_history = []
    # Lấy 6 tin nhắn gần nhất để AI nhớ ngữ cảnh mà không tốn quá nhiều Token
    recent_history = history[-6:]

    for msg in recent_history:
        if msg['role'] == 'user':
            chat_history.append(HumanMessage(content=msg['content']))
        elif msg['role'] == 'bot':
            # Làm sạch tin nhắn bot: Bỏ các mã dữ liệu biểu đồ để tránh rối loạn AI
            clean_content = msg['content'].split("[CHART_DATA_START]")[0]
            chat_history.append(AIMessage(content=clean_content))

    # --- 6. Tạo Agent & Thực thi ---
    prompt = ChatPromptTemplate.from_messages([
        ("system", formatted_system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    # Tạo Agent (Phiên bản Tool Calling hiện đại)
    agent = create_tool_calling_agent(llm, tools, prompt)

    # Tạo Executor
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    try:
        # Thực thi Agent (Truyền tham số động)
        result = agent_executor.invoke({
            "input": user_message,
            "chat_history": chat_history,
            "current_date": today.strftime("%Y-%m-%d"),
            "weekday": weekday_str
        })
        return result["output"]

    except Exception as e:
        print(f"❌ Chatbot Error: {str(e)}")
        # Trả về câu fallback an toàn để Frontend không bị trắng trang
        return "Xin lỗi, hệ thống đang bận hoặc gặp lỗi kết nối AI. Bạn vui lòng thử lại sau giây lát nhé!"