# db/database.py
import os
import sys
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# 1. Cấu hình Logging (Chuyên nghiệp hơn print)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 2. Load biến môi trường
load_dotenv()

# 3. Lấy và Xử lý URL Database
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("❌ ERROR: DATABASE_URL is missing! Please check .env or Render Config.")
    sys.exit(1) # Dừng chương trình ngay nếu không có DB (An toàn hơn fallback bừa bãi)

# Fix lỗi tương thích 'postgres://' (cho các cloud cũ)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 4. Tạo Engine (ĐÃ TỐI ƯU HÓA)
try:
    engine = create_engine(
        DATABASE_URL,
        # --- CẤU HÌNH QUAN TRỌNG CHO CLOUD ---
        pool_pre_ping=True,   # Tự động kiểm tra kết nối trước khi dùng (Tránh lỗi disconnect)
        pool_size=20,         # Số lượng kết nối duy trì sẵn
        max_overflow=10,      # Số kết nối được phép tràn ra khi quá tải
        pool_recycle=1800     # Tái tạo kết nối mỗi 30 phút để tránh timeout
    )
    # Log xác nhận (Che mật khẩu)
    safe_url = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "UNKNOWN"
    logger.info(f"✅ Connected to Database at: ...@{safe_url}")
except Exception as e:
    logger.critical(f"❌ SQLAlchemy Engine Error: {e}")
    sys.exit(1)

# 5. Tạo Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 6. Base Model
Base = declarative_base()

# 7. Dependency (Dùng trong các Router)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()