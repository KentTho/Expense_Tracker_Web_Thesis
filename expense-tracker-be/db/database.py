# db/database.py
import os
import sys
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Import cho Async (Đã gộp gọn gàng)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

# 1. Cấu hình Logging (Chuyên nghiệp hơn print)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 2. Load biến môi trường
load_dotenv()

# 3. Lấy và Xử lý URL Database
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("❌ ERROR: DATABASE_URL is missing! Please check .env or Render Config.")
    sys.exit(1)

# Fix lỗi tương thích 'postgres://' (cho các cloud cũ)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# TẠO URL RIÊNG CHO ASYNC (Thêm dòng này)
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# 4. Tạo Engine (ĐÃ TỐI ƯU HÓA)
# --- ENGINE ĐỒNG BỘ (SYNC) ---
try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=20,
        max_overflow=10,
        pool_recycle=1800
    )
    safe_url = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "UNKNOWN"
    logger.info(f"✅ Connected to Sync Database at: ...@{safe_url}")
except Exception as e:
    logger.critical(f"❌ SQLAlchemy Sync Engine Error: {e}")
    sys.exit(1)

# --- ENGINE BẤT ĐỒNG BỘ (ASYNC) - MỚI CHÈN ---
try:
    # Đổi tên thành async_engine để không trùng với engine ở trên
    async_engine = create_async_engine(
        ASYNC_DATABASE_URL,
        pool_pre_ping=True,
        pool_size=20,
        max_overflow=10,
        pool_recycle=1800
    )
    logger.info(f"✅ Connected to Async Database at: ...@{safe_url}")
except Exception as e:
    logger.critical(f"❌ SQLAlchemy Async Engine Error: {e}")
    sys.exit(1)


# 5. Tạo Session
# Session cho Sync
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Session cho Async (MỚI CHÈN)
AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False
)

# 6. Base Model
Base = declarative_base()

# 7. Dependency (Dùng trong các Router)
# Dependency cũ cho Sync
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency mới cho Async (BẠN SẼ CẦN CÁI NÀY KHI VIẾT API)
async def get_async_db():
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()