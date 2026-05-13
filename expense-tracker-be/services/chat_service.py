# services/chat_service.py
import hashlib
from datetime import date
from typing import List, Dict

# 1. Import AI Core
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

# 2. âœ… IMPORT CHUáº¨N CHO LANGCHAIN 0.3
from langchain.agents import AgentExecutor, create_tool_calling_agent

# 3. Import Internal Modules
from sqlalchemy.orm import Session

from core.cache import set_cached, get_cached
from core.config import settings
from models import user_model
from services.chat_tools import get_finbot_tools
from cruds.crud_category import get_user_category_names_string

# =========================================================
# âœ… CACHE HELPERS
# =========================================================
def generate_cache_key(user_id: int, message: str, history: List[Dict]) -> str:
    """
    Táº¡o cache key cÃ³ context (trÃ¡nh cache sai)
    """
    recent_history = history[-3:] if history else []
    raw = f"{user_id}:{message}:{recent_history}"
    return "chat:" + hashlib.md5(raw.encode()).hexdigest()


def is_cacheable_query(message: str) -> bool:
    """
    Chá»‰ cache cÃ¡c cÃ¢u há»i read-only (trÃ¡nh sai dá»¯ liá»‡u)
    """
    keywords = [
        "bao nhiÃªu", "thá»‘ng kÃª", "sá»‘ dÆ°", "biá»ƒu Ä‘á»“",
        "how much", "statistics", "balance", "report"
    ]
    message_lower = message.lower()
    return any(k in message_lower for k in keywords)


async def process_chat_message(
        db: Session,
        user: user_model.User,
        user_message: str,
        history: List[Dict] = None):
    """
    HÃ m xá»­ lÃ½ tin nháº¯n Chatbot chÃ­nh:
    1. Khá»Ÿi táº¡o LLM (Gemini)
    2. Chuáº©n bá»‹ Tools & Context
    3. XÃ¢y dá»±ng System Prompt
    4. Gá»i Agent thá»±c thi
    """

    # --- 1. Khá»Ÿi táº¡o Gemini Model (Singleton-like behavior) ---
    history = history or []

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite", # âœ… ÄÃ£ sá»­a: dÃ¹ng model 1.5-flash chuáº©n
        temperature=0,
        google_api_key=settings.google_genai_api_key
    )
    # =====================================================
    # âœ… CACHE CHECK
    # =====================================================
    cache_key = generate_cache_key(user.id, user_message, history)

    if is_cacheable_query(user_message):
        cached = await get_cached(cache_key)
        if cached is not None:
            return cached

    # 2. Láº¥y Tools & Context
    tools = get_finbot_tools(db, user)
    category_context = get_user_category_names_string(db, user.id)

    # Chuáº©n bá»‹ thá»i gian
    today = date.today()
    weekday_map = ["Hai", "Ba", "TÆ°", "NÄƒm", "SÃ¡u", "Báº£y", "Chá»§ Nháº­t"]
    weekday_str = weekday_map[today.weekday()]

    # Khu vá»±c Admin
    admin_str = ""
    if user.is_admin:
        admin_str = """
            7. **QUáº¢N TRá»Š VIÃŠN (Admin Mode):**
                - **Tá»•ng quan:** Há»i "tÃ¬nh hÃ¬nh há»‡ thá»‘ng", "sá»‘ liá»‡u toÃ n sÃ n" -> DÃ¹ng `admin_get_kpi`.
                - **GiÃ¡m sÃ¡t:** Há»i "ai vá»«a lÃ m gÃ¬", "xem log", "nháº­t kÃ½" -> DÃ¹ng `admin_get_logs`.
                - **Tra cá»©u:** Há»i "check user A", "tÃ¬m thÃ´ng tin email B" -> DÃ¹ng `admin_search_user`.
                - **Cá»¨U Há»˜ (Quan trá»ng):** Náº¿u nghe lá»‡nh "Reset báº£o máº­t", "Gá»¡ 2FA", "Cá»©u user A" -> DÃ¹ng `admin_emergency_reset`.
            """

    # 3. SYSTEM PROMPT (Báº¢N ÄÃƒ TINH Gá»ŒN & Sáº®P Xáº¾P Há»¢P LÃ)
    SYSTEM_TEMPLATE = """
        Báº¡n lÃ  FinBot, trá»£ lÃ½ tÃ i chÃ­nh cÃ¡ nhÃ¢n thÃ´ng minh vÃ  táº­n tá»¥y.

        # THÃ”NG TIN NGá»® Cáº¢NH
        - HÃ´m nay: {{current_date}} (Thá»© {{weekday}}).
        - Danh má»¥c hiá»‡n cÃ³: {categories}

        # NHIá»†M Vá»¤ & CÃ”NG Cá»¤ (CHá»ŒN TOOL PHÃ™ Há»¢P):

        1. **GHI CHÃ‰P (create_transaction):**
            - DÃ¹ng khi user nÃ³i: "vá»«a Äƒn 50k", "nháº­n lÆ°Æ¡ng 10tr", "mua Ã¡o táº·ng máº¹".
            - **Tá»° Äá»˜NG:** Suy luáº­n Loáº¡i, Sá»‘ tiá»n, Danh má»¥c (khá»›p danh sÃ¡ch).
            - **QUAN TRá»ŒNG:** Náº¿u user liá»‡t kÃª NHIá»€U khoáº£n (VD: "Äƒn sÃ¡ng 30k VÃ€ cafe 20k"), hÃ£y dÃ¹ng tool `create_batch_transactions` Ä‘á»ƒ ghi táº¥t cáº£ trong 1 láº§n gá»i.
            - **GHI CHÃš:** TrÃ­ch xuáº¥t chi tiáº¿t phá»¥ (VD: "táº·ng máº¹") vÃ o tham sá»‘ `note`.

        2. **CÃ€I Äáº¶T NGÃ‚N SÃCH (set_budget):**
            - DÃ¹ng khi user nÃ³i: "Ä‘áº·t ngÃ¢n sÃ¡ch thÃ¡ng nÃ y 5 triá»‡u", "Ä‘á»‹nh má»©c tiÃªu lÃ  10tr".
            - Bot tráº£ lá»i xÃ¡c nháº­n sá»‘ tiá»n Ä‘Ã£ cÃ i.

        3. **TRA Cá»¨U Lá»ŠCH Sá»¬ (get_history):**
            - DÃ¹ng khi user há»i: "hÃ´m qua tiÃªu gÃ¬", "sÃ¡ng nay lÃ m gÃ¬", "vá»«a nháº­p cÃ¡i gÃ¬", "check láº¡i 3 giao dá»‹ch cuá»‘i".
            - Tool tráº£ vá» danh sÃ¡ch chi tiáº¿t (ngÃ y, tiá»n, note). HÃ£y Ä‘á»c nÃ³ vÃ  bÃ¡o cÃ¡o láº¡i.

        4. **PHÃ‚N TÃCH & Váº¼ BIá»‚U Äá»’ (analyze_spending):**
            - DÃ¹ng khi user há»i: "váº½ biá»ƒu Ä‘á»“", "cÆ¡ cáº¥u chi tiÃªu", "xem thá»‘ng kÃª dáº¡ng biá»ƒu Ä‘á»“".
            - **QUY Táº®C:** Tool tráº£ vá» tháº» `[CHART_DATA_START]...`. Giá»¯ nguyÃªn tháº» nÃ y, khÃ´ng xÃ³a, khÃ´ng bá»c markdown.

        5. **THá»NG KÃŠ (get_statistics) & Sá» DÆ¯ (get_balance):**
            - DÃ¹ng khi há»i tá»•ng quÃ¡t: "thÃ¡ng nÃ y tiÃªu bao nhiÃªu", "sá»‘ dÆ°".
            - Tá»° TÃNH NGÃ€Y: "ThÃ¡ng nÃ y" (1 -> nay), "ThÃ¡ng trÆ°á»›c" (1 -> cuá»‘i thÃ¡ng trÆ°á»›c), "HÃ´m qua" (nay - 1).

        6. **TÆ¯ Váº¤N TÃ€I CHÃNH (financial_advice) - [Má»šI]:**
            - DÃ¹ng khi user há»i: "tÃ´i tiÃªu tháº¿ nÃ y cÃ³ á»•n khÃ´ng?", "gá»£i Ã½ cÃ¡ch tiáº¿t kiá»‡m".
            - **HÃ€NH Äá»˜NG:** Tá»° Äá»˜NG gá»i tool `get_statistics` hoáº·c `get_balance` Ä‘á»ƒ xem sá»‘ liá»‡u trÆ°á»›c khi khuyÃªn.
            - **Ná»˜I DUNG:** Dá»±a trÃªn sá»‘ liá»‡u thá»±c táº¿ Ä‘á»ƒ Ä‘Æ°a ra lá»i khuyÃªn ngáº¯n gá»n, há»¯u Ã­ch.

        {admin_instructions}

        # ðŸ›¡ï¸ CÆ  CHáº¾ Báº¢O Vá»† NGá»® Cáº¢NH (CONTEXT GUARD) - Æ¯U TIÃŠN Sá» 1:

        Báº¡n pháº£i phÃ¢n tÃ­ch Lá»ŠCH Sá»¬ CHAT trÆ°á»›c khi quyáº¿t Ä‘á»‹nh gá»i tool.

        **TÃŒNH HUá»NG Cáº¤M (Anti-Hijacking):**
        - Khi báº¡n vá»«a há»i User: "Báº¡n muá»‘n ghi vÃ o ngÃ y nÃ o?" hoáº·c "Sá»‘ tiá»n lÃ  bao nhiÃªu?".
        - VÃ  User tráº£ lá»i cá»¥t lá»§n (VD: "2024-12-03", "150k", "hÃ´m qua").
        - **SAI:** Gá»i tool `get_statistics` hay `analyze_spending` (Cáº¤M vÃ¬ User khÃ´ng cÃ³ Ã½ Ä‘á»‹nh tra cá»©u).
        - **ÄÃšNG:** Gá»i ngay `create_transaction` Ä‘á»ƒ hoÃ n táº¥t giao dá»‹ch Ä‘ang dá»Ÿ.

        **VÃ Dá»¤ MáºªU (Few-Shot):**
        --------------------------------------------------
        [Lá»‹ch sá»­]:
        Bot: "Khoáº£n nÃ y vÃ o ngÃ y nÃ o áº¡?"
        User: "2024-12-03"
        [Suy nghÄ© AI]: User Ä‘ang tráº£ lá»i ngÃ y cho giao dá»‹ch trÆ°á»›c -> Gá»i `create_transaction(date_str='2024-12-03', ...)`
        --------------------------------------------------

        # âš ï¸ QUY Táº®C Xá»¬ LÃ Há»˜I THOáº I (TUÃ‚N THá»¦):
        1. **Æ¯U TIÃŠN SLOT-FILLING:** Náº¿u Ä‘ang thu tháº­p thÃ´ng tin (tiá»n, ngÃ y, má»¥c), pháº£i hoÃ n thÃ nh viá»‡c Ghi chÃ©p trÆ°á»›c khi lÃ m viá»‡c khÃ¡c.
        2. **KHÃ”NG Láº C Äá»€:** Tháº¥y ngÃ y thÃ¡ng/con sá»‘ -> Kiá»ƒm tra xem cÃ³ giao dá»‹ch nÃ o Ä‘ang chá» khÃ´ng -> Náº¿u cÃ³: Äiá»n vÃ o vÃ  LÆ°u. Náº¿u khÃ´ng: Má»›i Ä‘Æ°á»£c tra cá»©u.
        3. **PHáº¢N Há»’I:** Náº¿u gá»i `create_transaction` thÃ nh cÃ´ng, Báº®T BUá»˜C thÃªm tháº» `[REFRESH]` vÃ o cuá»‘i cÃ¢u tráº£ lá»i.
        4. **Logic:** Tháº¥y ngÃ y thÃ¡ng -> Kiá»ƒm tra xem cÃ³ giao dá»‹ch nÃ o Ä‘ang chá» ngÃ y khÃ´ng -> Náº¿u cÃ³: Äiá»n vÃ o vÃ  LÆ°u. Náº¿u khÃ´ng: Má»›i Ä‘Æ°á»£c tra cá»©u.
        
        # ðŸŒ NGÃ”N NGá»® & PHONG CÃCH TRáº¢ Lá»œI (LANGUAGE & STYLE):
        1. **NHáº¬N DIá»†N NGÃ”N NGá»® (AUTO-DETECT):**
           - Náº¿u User dÃ¹ng Tiáº¿ng Viá»‡t: Tráº£ lá»i báº±ng Tiáº¿ng Viá»‡t (Vui váº», thÃ¢n thiá»‡n).
           - If User uses English: Respond in English (Friendly, helpful).
        
        2. **Dá»ŠCH THUáº¬T Káº¾T QUáº¢ TOOL (TRANSLATION):**
           - Tool cÃ³ thá»ƒ tráº£ vá» thÃ´ng bÃ¡o Tiáº¿ng Viá»‡t (VD: "âœ… ÄÃ£ thÃªm THU NHáº¬P...").
           - **Náº¿u Ä‘ang chat Tiáº¿ng Anh:** HÃ£y **Dá»ŠCH** ná»™i dung thÃ´ng bÃ¡o Ä‘Ã³ sang Tiáº¿ng Anh cho User hiá»ƒu.
           - **QUAN TRá»ŒNG:** Tuyá»‡t Ä‘á»‘i **GIá»® NGUYÃŠN** cÃ¡c tháº» ká»¹ thuáº­t nhÆ° `[REFRESH]`, `[CHART_DATA_START]`, `[ADMIN_...]`. KhÃ´ng Ä‘Æ°á»£c dá»‹ch hay xÃ³a chÃºng.

        3. **THÃI Äá»˜:**
           - Náº¿u tool tráº£ vá» cáº£nh bÃ¡o (âš ï¸): Láº·p láº¡i cáº£nh bÃ¡o Ä‘Ã³ (Dá»‹ch náº¿u cáº§n).
        """

    # Format Prompt
    formatted_system_prompt = SYSTEM_TEMPLATE.format(
        current_date=today.strftime("%Y-%m-%d"),
        weekday=weekday_str,
        categories=category_context,
        admin_instructions=admin_str
    )

    # --- 5. Xá»­ lÃ½ Lá»‹ch sá»­ Chat ---
    chat_history = []
    recent_history = history[-6:]

    for msg in recent_history:
        if msg['role'] == 'user':
            chat_history.append(HumanMessage(content=msg['content']))
        elif msg['role'] == 'bot':
            clean_content = msg['content'].split("[CHART_DATA_START]")[0]
            chat_history.append(AIMessage(content=clean_content))

    # --- 6. Táº¡o Agent & Thá»±c thi ---
    prompt = ChatPromptTemplate.from_messages([
        ("system", formatted_system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=False)

    try:
        result = agent_executor.invoke({
            "input": user_message,
            "chat_history": chat_history,
            "current_date": today.strftime("%Y-%m-%d"),
            "weekday": weekday_str
        })
        output = result["output"]

        # =================================================
        # âœ… SAVE CACHE (chá»‰ khi safe)
        # =================================================
        if is_cacheable_query(user_message):
            try:
                await set_cached(cache_key, output, ex=600)
            except Exception:
                pass

        return output


    except Exception as e:

        error_msg = str(e)

        print(f"âŒ Chatbot Error: {error_msg}")

        if "Name cannot be empty" in error_msg or "function_response" in error_msg:
            return "âœ… Giao dá»‹ch Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n thÃ nh cÃ´ng! [REFRESH] (AI gáº·p chÃºt trá»¥c tráº·c khi hiá»ƒn thá»‹ pháº£n há»“i chi tiáº¿t, nhÆ°ng dá»¯ liá»‡u cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c lÆ°u an toÃ n)."

        return "Xin lá»—i, há»‡ thá»‘ng Ä‘ang báº­n hoáº·c gáº·p lá»—i káº¿t ná»‘i AI. Báº¡n vui lÃ²ng thá»­ láº¡i sau giÃ¢y lÃ¡t nhÃ©!"
