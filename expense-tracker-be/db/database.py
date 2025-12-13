# db/database.py
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# 1. Load biến môi trường (quan trọng cho local)
load_dotenv()

# 2. Lấy URL từ biến môi trường
DATABASE_URL = os.getenv("DATABASE_URL")

# --- DEBUG LOG (Rất quan trọng để soi lỗi) ---
if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL variable is NOT set. Backend cannot connect to DB.")
    # Fallback tạm thời (chỉ dùng cho local, lên Railway sẽ gây lỗi nếu biến ENV chưa set)
    DATABASE_URL = "postgresql://admin:123456@localhost:5432/expense_tracker_app"
    print(f"⚠️ Using fallback localhost URL: {DATABASE_URL}")
else:
    # Che mật khẩu để in log an toàn
    safe_url = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "UNKNOWN"
    print(f"✅ Found DATABASE_URL environment variable. Connecting to: ...@{safe_url}")

# 3. Fix lỗi tương thích url bắt đầu bằng 'postgres://' (của Heroku/Railway cũ)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 4. Tạo Engine
try:
    engine = create_engine(DATABASE_URL)
except Exception as e:
    print(f"❌ SQLAlchemy Engine Error: {e}")
    sys.exit(1)

# 5. Tạo Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 6. Base Model
Base = declarative_base()

# 7. Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()