# main.py
import os
import json
from contextlib import contextmanager

# Thư viện ngoài (External Libraries)
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth as fb_auth

# Thư viện nội bộ (Internal Imports)
import models
from db.database import SessionLocal, engine, get_db
from cruds.crud_category import seed_default_categories
from routes import (
    auth_route, income_route, category_route, expense_route,
    transaction_route, dashboard_route, export_route, analytics_route, summary_route
)

# -------------------------------------------------
# 1. Khởi tạo & Cấu hình môi trường
# -------------------------------------------------
load_dotenv()
firebase_key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")

# -------------------------------------------------
# 2. Khởi tạo Firebase
# -------------------------------------------------
if not firebase_admin._apps:
    if firebase_key_json:
        try:
            firebase_dict = json.loads(firebase_key_json)
            cred = credentials.Certificate(firebase_dict)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized successfully.")
        except Exception as e:
            # Lỗi khi parse JSON hoặc khởi tạo
            print(f"❌ Error loading Firebase credentials: {e}")
            raise RuntimeError("Lỗi cấu hình Firebase. Kiểm tra biến FIREBASE_SERVICE_ACCOUNT.")
    else:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT not found in .env")


# -------------------------------------------------
# 3. Khởi tạo DB & Seeding logic
# -------------------------------------------------

# Đảm bảo các bảng được tạo (Migration/Schema creation)
models.Base.metadata.create_all(bind=engine)


# Helper để lấy DB session an toàn
@contextmanager
def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------------------------------
# 4. Cấu hình FastAPI & CORS
# -------------------------------------------------
app = FastAPI(title="Expense Tracker API", description="API for managing personal income and expenses.")

@app.on_event("startup")
def startup_event():
    """Chạy hàm seed categories khi ứng dụng khởi động"""
    print("---------------------------------------")
    print("🚀 Bắt đầu Database Seeding...")
    with get_db_session() as db:
        try:
            # Gọi hàm seeding (chỉ chạy nếu chưa tồn tại)
            seed_default_categories(db)
            print("✅ Database Seeding hoàn tất.")
        except Exception as e:
            print(f"❌ Lỗi khi seeding database: {e}")
    print("---------------------------------------")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Thêm domain frontend của bạn tại đây
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký Router
app.include_router(auth_route.router)
app.include_router(income_route.router)
app.include_router(category_route.router)
app.include_router(expense_route.router)
app.include_router(transaction_route.router)
app.include_router(dashboard_route.router)
app.include_router(export_route.router)
app.include_router(analytics_route.router)
app.include_router(summary_route.router)
# Route cơ bản
@app.get("/", tags=["Root"])
def root():
    return {"message": "Expense Tracker API is running successfully!"}
