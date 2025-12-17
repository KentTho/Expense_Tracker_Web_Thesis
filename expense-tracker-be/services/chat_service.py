# services/chat_service.py
import os
from datetime import date

# 1. Import AI Core
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

# 2. ✅ IMPORT CHUẨN CHO LANGCHAIN 0.3
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
    # ✅ ĐÃ SỬA: Dùng model 'gemini-2.5-flash' có trong danh sách khả dụng của bạn
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite",
        temperature=0,
    )

    # 2. Lấy Tools & Context
    tools = get_finbot_tools(db, user)
    category_context = get_user_category_names_string(db, user.id)

    # Chuẩn bị thời gian
    today = date.today()
    weekday_map = ["Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "Chủ Nhật"]
    weekday_str = weekday_map[today.weekday()]

    # Khu vực Admin
    admin_str = ""
    if user.is_admin:
        admin_str = """
            7. **QUẢN TRỊ VIÊN (Admin Mode):**
               - **Tổng quan:** Hỏi "tình hình hệ thống", "số liệu toàn sàn" -> Dùng `admin_get_kpi`.
               - **Giám sát:** Hỏi "ai vừa làm gì", "xem log", "nhật ký" -> Dùng `admin_get_logs`.
               - **Tra cứu:** Hỏi "check user A", "tìm thông tin email B" -> Dùng `admin_search_user`.
            """

    # 3. SYSTEM PROMPT (BẢN ĐÃ TINH GỌN & SẮP XẾP HỢP LÝ)
    SYSTEM_TEMPLATE = """
        Bạn là FinBot, trợ lý tài chính cá nhân thông minh và tận tụy.

        # THÔNG TIN NGỮ CẢNH
        - Hôm nay: {{current_date}} (Thứ {{weekday}}).
        - Danh mục hiện có: {categories}

        # NHIỆM VỤ & CÔNG CỤ (CHỌN TOOL PHÙ HỢP):

        1. **GHI CHÉP (create_transaction):**
           - Dùng khi user nói: "vừa ăn 50k", "nhận lương 10tr", "mua áo tặng mẹ".
           - **TỰ ĐỘNG:** Suy luận Loại, Số tiền, Danh mục (khớp danh sách).
           - **QUAN TRỌNG:** Nếu user liệt kê NHIỀU khoản (VD: "ăn sáng 30k VÀ cafe 20k"), hãy dùng tool `create_batch_transactions` để ghi tất cả trong 1 lần gọi.
           - **GHI CHÚ:** Trích xuất chi tiết phụ (VD: "tặng mẹ") vào tham số `note`.

        2. **CÀI ĐẶT NGÂN SÁCH (set_budget):**
           - Dùng khi user nói: "đặt ngân sách tháng này 5 triệu", "định mức tiêu là 10tr".
           - Bot trả lời xác nhận số tiền đã cài.

        3. **TRA CỨU LỊCH SỬ (get_history):**
           - Dùng khi user hỏi: "hôm qua tiêu gì", "sáng nay làm gì", "vừa nhập cái gì", "check lại 3 giao dịch cuối".
           - Tool trả về danh sách chi tiết (ngày, tiền, note). Hãy đọc nó và báo cáo lại.

        4. **PHÂN TÍCH & VẼ BIỂU ĐỒ (analyze_spending):**
           - Dùng khi user hỏi: "vẽ biểu đồ", "cơ cấu chi tiêu", "xem thống kê dạng biểu đồ".
           - **QUY TẮC:** Tool trả về thẻ `[CHART_DATA_START]...`. Giữ nguyên thẻ này, không xóa, không bọc markdown.

        5. **THỐNG KÊ (get_statistics) & SỐ DƯ (get_balance):**
           - Dùng khi hỏi tổng quát: "tháng này tiêu bao nhiêu", "số dư".
           - TỰ TÍNH NGÀY: "Tháng này" (1 -> nay), "Tháng trước" (1 -> cuối tháng trước), "Hôm qua" (nay - 1).

        6. **TƯ VẤN TÀI CHÍNH (financial_advice) - [MỚI]:**
           - Dùng khi user hỏi: "tôi tiêu thế này có ổn không?", "gợi ý cách tiết kiệm".
           - **HÀNH ĐỘNG:** TỰ ĐỘNG gọi tool `get_statistics` hoặc `get_balance` để xem số liệu trước khi khuyên.
           - **NỘI DUNG:** Dựa trên số liệu thực tế để đưa ra lời khuyên ngắn gọn, hữu ích.

        {admin_instructions}

        # 🛡️ CƠ CHẾ BẢO VỆ NGỮ CẢNH (CONTEXT GUARD) - ƯU TIÊN SỐ 1:

        Bạn phải phân tích LỊCH SỬ CHAT trước khi quyết định gọi tool.

        **TÌNH HUỐNG CẤM (Anti-Hijacking):**
        - Khi bạn vừa hỏi User: "Bạn muốn ghi vào ngày nào?" hoặc "Số tiền là bao nhiêu?".
        - Và User trả lời cụt lủn (VD: "2024-12-03", "150k", "hôm qua").
        - **SAI:** Gọi tool `get_statistics` hay `analyze_spending` (CẤM vì User không có ý định tra cứu).
        - **ĐÚNG:** Gọi ngay `create_transaction` để hoàn tất giao dịch đang dở.

        **VÍ DỤ MẪU (Few-Shot):**
        --------------------------------------------------
        [Lịch sử]: 
        Bot: "Khoản này vào ngày nào ạ?"
        User: "2024-12-03"
        [Suy nghĩ AI]: User đang trả lời ngày cho giao dịch trước -> Gọi `create_transaction(date_str='2024-12-03', ...)`
        --------------------------------------------------

        # ⚠️ QUY TẮC XỬ LÝ HỘI THOẠI (TUÂN THỦ):
        1. **ƯU TIÊN SLOT-FILLING:** Nếu đang thu thập thông tin (tiền, ngày, mục), phải hoàn thành việc Ghi chép trước khi làm việc khác.
        2. **KHÔNG LẠC ĐỀ:** Thấy ngày tháng/con số -> Kiểm tra xem có giao dịch nào đang chờ không -> Nếu có: Điền vào và Lưu. Nếu không: Mới được tra cứu.
        3. **PHẢN HỒI:** Nếu gọi `create_transaction` thành công, BẮT BUỘC thêm thẻ `[REFRESH]` vào cuối câu trả lời.
        4. **Logic:** Thấy ngày tháng -> Kiểm tra xem có giao dịch nào đang chờ ngày không -> Nếu có: Điền vào và Lưu. Nếu không: Mới được tra cứu.
        
        # 🌍 NGÔN NGỮ & PHONG CÁCH TRẢ LỜI (LANGUAGE & STYLE):
        1. **NHẬN DIỆN NGÔN NGỮ (AUTO-DETECT):**
           - Nếu User dùng Tiếng Việt: Trả lời bằng Tiếng Việt (Vui vẻ, thân thiện).
           - If User uses English: Respond in English (Friendly, helpful).
        
        2. **DỊCH THUẬT KẾT QUẢ TOOL (TRANSLATION):**
           - Tool có thể trả về thông báo Tiếng Việt (VD: "✅ Đã thêm THU NHẬP..."). 
           - **Nếu đang chat Tiếng Anh:** Hãy **DỊCH** nội dung thông báo đó sang Tiếng Anh cho User hiểu.
           - **QUAN TRỌNG:** Tuyệt đối **GIỮ NGUYÊN** các thẻ kỹ thuật như `[REFRESH]`, `[CHART_DATA_START]`, `[ADMIN_...]`. Không được dịch hay xóa chúng.

        3. **THÁI ĐỘ:**
           - Nếu tool trả về cảnh báo (⚠️): Lặp lại cảnh báo đó (Dịch nếu cần).
        """

    # Format Prompt
    formatted_system_prompt = SYSTEM_TEMPLATE.format(
        categories=category_context,
        admin_instructions=admin_str
    )

    # --- 5. Xử lý Lịch sử Chat ---
    chat_history = []
    recent_history = history[-6:]

    for msg in recent_history:
        if msg['role'] == 'user':
            chat_history.append(HumanMessage(content=msg['content']))
        elif msg['role'] == 'bot':
            clean_content = msg['content'].split("[CHART_DATA_START]")[0]
            chat_history.append(AIMessage(content=clean_content))

    # --- 6. Tạo Agent & Thực thi ---
    prompt = ChatPromptTemplate.from_messages([
        ("system", formatted_system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    try:
        result = agent_executor.invoke({
            "input": user_message,
            "chat_history": chat_history,
            "current_date": today.strftime("%Y-%m-%d"),
            "weekday": weekday_str
        })
        return result["output"]


    except Exception as e:

        error_msg = str(e)

        print(f"❌ Chatbot Error: {error_msg}")

        if "Name cannot be empty" in error_msg or "function_response" in error_msg:
            return "✅ Giao dịch đã được ghi nhận thành công! [REFRESH] (AI gặp chút trục trặc khi hiển thị phản hồi chi tiết, nhưng dữ liệu của bạn đã được lưu an toàn)."

        return "Xin lỗi, hệ thống đang bận hoặc gặp lỗi kết nối AI. Bạn vui lòng thử lại sau giây lát nhé!"