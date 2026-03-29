import logging
import os
import json
from contextlib import asynccontextmanager, contextmanager

# Thư viện ngoài
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials

# Thư viện nội bộ
from db.database import SessionLocal, engine, Base
from cruds.crud_category import seed_default_categories
from routes import (
    auth_route,
    income_route,
    category_route,
    expense_route,
    transaction_route,
    dashboard_route,
    export_route,
    analytics_route,
    summary_route,
    security_route,
    admin_route,
    system_route,
    chat_route
)

from core.cache import init_redis, close_redis, check_redis_health

logger = logging.getLogger(__name__)

# -------------------------------------------------
# 1. Cấu hình môi trường & Firebase
# -------------------------------------------------
load_dotenv()  # Điểm mạnh: Load ENV sớm → an toàn, dễ config (e.g., Railway inject vars). Gợi ý: Dùng pydantic-settings để validate ENV (đã có trong reqs).

# Khởi tạo Firebase ngay khi file chạy
# Logic này sẽ đọc chuỗi JSON từ Railway Variable
if not firebase_admin._apps:  # Check singleton tốt, tránh init multiple.
    firebase_key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    if firebase_key_json:
        try:
            # Parse chuỗi JSON thành Dict
            firebase_dict = json.loads(firebase_key_json)  # Smart: Handle JSON string từ ENV (tốt cho cloud deploy).
            cred = credentials.Certificate(firebase_dict)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase initialized successfully.")
        except Exception as e:
            logger.error(f"Error loading Firebase credentials: {e}")
            # Không raise error để app vẫn chạy được, nhưng in log đỏ để biết  # Graceful error handling tốt – app không crash nếu Firebase fail (e.g., auth fallback JWT).
            pass
    else:
        logger.warning("FIREBASE_SERVICE_ACCOUNT not found in ENV.")

# -------------------------------------------------
# 2. Helper Database
# -------------------------------------------------
# Tạo bảng nếu chưa có (Rất quan trọng cho lần chạy đầu tiên trên Railway)
Base.metadata.create_all(bind=engine)  # Sync create tables – OK cho startup, nhưng production dùng Alembic migrations (đã có alembic in reqs) để version control schema changes. Liên kết tiêu chí 2: DB design chuẩn.

@contextmanager
def get_db_session():  # Helper tốt cho non-async code (e.g., seeding).
    """Helper để lấy DB session cho việc seeding"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()  # Đảm bảo close session – tránh leak.

# Logger
logger = logging.getLogger(__name__)

# -------------------------------------------------
# 3. Cấu hình Lifespan (Startup & Shutdown)
# -------------------------------------------------
# =========================================================
# ✅ LIFESPAN (Startup + Shutdown)
# =========================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # =========================
    # 🚀 STARTUP
    # =========================
    logger.info("Application starting up...")

    # --- Init Redis ---
    init_redis()

    redis_ok = await check_redis_health()
    if redis_ok:
        logger.info("Redis connected")
    else:
        logger.warning("Redis not available (app van chay binh thuong)")

    # --- Seeding DB ---
    try:
        with get_db_session() as db:
            logger.info("Seeding default categories...")
            seed_default_categories(db)
            logger.info("Database seeding done")
    except Exception as e:
        logger.error(f"Seeding error: {e}")

    logger.info("---------------------------------------")

    yield  # 🚀 APP CHẠY TẠI ĐÂY

    # =========================
    # 🛑 SHUTDOWN
    # =========================
    logger.info("Application shutting down...")

    await close_redis()

    logger.info("Cleanup completed")
# -------------------------------------------------
# 4. Khởi tạo FastAPI
# -------------------------------------------------
app = FastAPI(
    title="Expense Tracker API",  # Docs tốt (Swagger auto-gen).
    description="API for managing personal income and expenses.",
    lifespan=lifespan  # Attach lifespan – pro.
)

# Cấu hình CORS (Cho phép Vercel truy cập)
origins = [
    "http://localhost:3000",  # Localhost Frontend
    "http://127.0.0.1:8000",  # Localhost Backend
    "https://expense-tracker-web-thesis.vercel.app",  # Backend Railway  # Specific origins tốt, nhưng dưới dùng ["*"] – conflict? Thay origins=["*"] bằng list này để secure hơn.
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Quan trọng: Dấu * nghĩa là chấp nhận mọi nơi (Local, Vercel, v.v...)  # OK cho dev, nhưng production lock to origins list (tránh CORS attacks).
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép mọi phương thức: GET, POST, PUT, DELETE...
    allow_headers=["*"],  # Cho phép mọi loại header  # Rộng, nhưng cần cho auth (e.g., Authorization header).
)

# -------------------------------------------------
# 5. Đăng ký Router
# -------------------------------------------------
app.include_router(auth_route.router)  # Auth: Firebase + JWT (tiêu chí 1).
app.include_router(income_route.router)  # Income management.
app.include_router(category_route.router)
app.include_router(expense_route.router)  # Core expense flow (tiêu chí 4).
app.include_router(transaction_route.router)  # Transactions – nơi cần race condition control (tiêu chí 3).
app.include_router(dashboard_route.router)
app.include_router(export_route.router)  # Export: Tiềm năng cho background job (tiêu chí 7).
app.include_router(analytics_route.router)  # Analytics: Cần cache (tiêu chí 6).
app.include_router(summary_route.router)
app.include_router(security_route.router)  # Security: 2FA? (pyotp in reqs).
app.include_router(admin_route.router)
app.include_router(system_route.router)
app.include_router(chat_route.router)  # Chat: LangChain integrate (cool cho AI summary expenses).


@app.get("/", tags=["Root"])
def root():  # Health check tốt.
    return {"message": "Expense Tracker API is running successfully!"}

if __name__ == "__main__":  # Local run only.
    import uvicorn
    # Chạy server ở port 8000 (Localhost)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)  # Dev mode tốt, production dùng uvicorn from CLI với workers (tiêu chí 5/8).

