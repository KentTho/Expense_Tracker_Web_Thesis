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

# -------------------------------------------------
# 1. Cấu hình môi trường & Firebase
# -------------------------------------------------
load_dotenv()

# Khởi tạo Firebase ngay khi file chạy
# Logic này sẽ đọc chuỗi JSON từ Railway Variable
if not firebase_admin._apps:
    firebase_key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    if firebase_key_json:
        try:
            # Parse chuỗi JSON thành Dict
            firebase_dict = json.loads(firebase_key_json)
            cred = credentials.Certificate(firebase_dict)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized successfully.")
        except Exception as e:
            print(f"❌ Error loading Firebase credentials: {e}")
            # Không raise error để app vẫn chạy được, nhưng in log đỏ để biết
            pass
    else:
        print("⚠️ WARNING: FIREBASE_SERVICE_ACCOUNT not found in ENV.")

# -------------------------------------------------
# 2. Helper Database
# -------------------------------------------------
# Tạo bảng nếu chưa có (Rất quan trọng cho lần chạy đầu tiên trên Railway)
Base.metadata.create_all(bind=engine)

@contextmanager
def get_db_session():
    """Helper để lấy DB session cho việc seeding"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------
# 3. Cấu hình Lifespan (Startup & Shutdown)
# -------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Hàm này chạy khi Server bắt đầu (Startup)
    và kết thúc (Shutdown).
    """
    # --- STARTUP LOGIC ---
    print("---------------------------------------")
    print("🚀 Application Starting Up...")

    # Chạy Seeding (Tạo Category mặc định)
    with get_db_session() as db:
        try:
            print("🌱 Seeding default categories...")
            seed_default_categories(db)
            print("✅ Database Seeding hoàn tất.")
        except Exception as e:
            print(f"❌ Lỗi khi seeding database: {e}")

    print("---------------------------------------")

    yield  # Server chạy tại đây (Lang nghe request)

    # --- SHUTDOWN LOGIC ---
    print("🛑 Application Shutting Down...")

# -------------------------------------------------
# 4. Khởi tạo FastAPI
# -------------------------------------------------
app = FastAPI(
    title="Expense Tracker API",
    description="API for managing personal income and expenses.",
    lifespan=lifespan
)

# Cấu hình CORS (Cho phép Vercel truy cập)
origins = [
    "http://localhost:3000",  # Localhost Frontend
    "http://127.0.0.1:8000",  # Localhost Backend
    "expense-tracker-web-thesis.vercel.app",  # Backend Railway

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Chỉ cho phép danh sách trên
    allow_credentials=True,  # Cho phép gửi cookie/token
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# 5. Đăng ký Router
# -------------------------------------------------
app.include_router(auth_route.router)
app.include_router(income_route.router)
app.include_router(category_route.router)
app.include_router(expense_route.router)
app.include_router(transaction_route.router)
app.include_router(dashboard_route.router)
app.include_router(export_route.router)
app.include_router(analytics_route.router)
app.include_router(summary_route.router)
app.include_router(security_route.router)
app.include_router(admin_route.router)
app.include_router(system_route.router)
app.include_router(chat_route.router)

@app.get("/", tags=["Root"])
def root():
    return {"message": "Expense Tracker API is running successfully!"}

if __name__ == "__main__":
    import uvicorn
    # Chạy server ở port 8000 (Localhost)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)