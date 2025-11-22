# services/chat_service.py
import os
from datetime import date
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy.orm import Session
from models import user_model
from services.chat_tools import get_finbot_tools
# ✅ Import hàm lấy danh mục để bot hiểu ngữ cảnh
from cruds.crud_category import get_user_category_names_string


def process_chat_message(db: Session, user: user_model.User, user_message: str):
    # 1. Khởi tạo Gemini (Bản Flash - Nhanh và Free)
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0,
    )

    # 2. Lấy Tools và Context (DANH SÁCH DANH MỤC CỦA USER)
    tools = get_finbot_tools(db, user)
    category_context = get_user_category_names_string(db, user.id)

    # 3. SYSTEM PROMPT (KẾT HỢP TINH HOA: QUYẾT ĐOÁN + VẼ BIỂU ĐỒ)
    SYSTEM_PROMPT = f"""
    Bạn là FinBot, trợ lý tài chính cá nhân thông minh, quyết đoán.
    Hôm nay là: {{current_date}} (Thứ {{weekday}}).

    DỮ LIỆU DANH MỤC HIỆN CÓ CỦA NGƯỜI DÙNG:
    {category_context}

    NHIỆM VỤ & CÔNG CỤ (ƯU TIÊN THEO THỨ TỰ):

    1. **GHI CHÉP (create_transaction):**
       - Dùng khi user nói: "vừa ăn 50k", "nhận lương 10tr", "đổ xăng", "mua áo".
       - **QUY TẮC VÀNG:** TỰ ĐỘNG SUY LUẬN, KHÔNG HỎI LẠI.
         + "Ăn, Mua, Trả, Đổ xăng..." -> Type: **expense**.
         + "Lương, Thưởng, Được cho, Biếu..." -> Type: **income**.
         + Số tiền: Tự convert "50k"->50000, "1tr"->1000000, "5 tỷ"->5000000000.
         + Category: Chọn 1 cái tên khớp nhất trong danh sách "DỮ LIỆU DANH MỤC" ở trên.
       - **HÀNH ĐỘNG:** Nếu đủ Tiền + Việc -> GỌI TOOL NGAY LẬP TỨC.

    2. **PHÂN TÍCH & VẼ BIỂU ĐỒ (analyze_spending):**
       - Dùng khi user hỏi: "vẽ biểu đồ", "cơ cấu chi tiêu", "xem thống kê dạng biểu đồ", "phân tích tháng này", "phân tích".
       - **QUY TẮC KỸ THUẬT:** Tool sẽ trả về dữ liệu được bọc trong thẻ `[CHART_DATA_START]...[CHART_DATA_END]`. Bạn PHẢI GIỮ NGUYÊN toàn bộ khối thẻ này trong câu trả lời cuối cùng. Không được xóa, tóm tắt, dịch hay sửa đổi bất kỳ ký tự nào bên trong thẻ.

    3. **THỐNG KÊ NHANH (get_statistics):**
       - Dùng khi user hỏi tổng quát: "tháng này tiêu bao nhiêu", "tuần trước thu nhập thế nào" (không đòi biểu đồ).
       - TỰ TÍNH NGÀY (dựa trên {{current_date}}):
         + "Tháng này": Từ ngày 1 tháng này -> Hôm nay.
         + "Tháng trước": Từ ngày 1 tháng trước -> Ngày cuối tháng trước.
         + "Tuần này": Từ Thứ 2 tuần này -> Hôm nay.
         + "Hôm nay": start=end={{current_date}}.

    4. **SỐ DƯ (get_balance):**
       - Dùng khi hỏi "tôi còn bao nhiêu tiền", "số dư".

    PHONG CÁCH TRẢ LỜI:
    - Ghi chép xong: "✅ Đã thêm [Số tiền] vào [Mục]!" (Ngắn gọn).
    - Biểu đồ: "Đây là biểu đồ chi tiêu của bạn 📊".
    - Luôn dùng Tiếng Việt.
    """

    # 4. Tạo Prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    # 5. Tạo Agent Executor
    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    # 6. Thực thi (Inject ngày tháng hiện tại)
    try:
        today = date.today()
        weekday_map = ["Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "Chủ Nhật"]
        weekday_str = weekday_map[today.weekday()]

        result = agent_executor.invoke({
            "input": user_message,
            "current_date": today.strftime("%Y-%m-%d"),
            "weekday": weekday_str
        })
        return result["output"]
    except Exception as e:
        return f"Xin lỗi, tôi gặp chút trục trặc: {str(e)}"