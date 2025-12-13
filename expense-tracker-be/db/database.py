# db/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Lấy URL từ biến môi trường (Ưu tiên số 1)
# Nếu không có (chạy local), mới dùng localhost
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback cho Localhost
    DATABASE_URL = "postgresql://admin:123456@localhost:5432/expense_tracker_app"

# 2. Fix lỗi tương thích url bắt đầu bằng 'postgres://' (của Heroku/Railway cũ)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"🔌 Connecting to Database: {DATABASE_URL.split('@')[-1]}") # Log host để debug (che pass)

# 3. Tạo Engine
engine = create_engine(DATABASE_URL)

# 4. Tạo Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 5. Base Model
Base = declarative_base()

# 6. Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()