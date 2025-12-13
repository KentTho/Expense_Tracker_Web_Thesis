# core/config.py
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Cấu hình cơ bản
    SECRET_KEY: str = "YOUR_SECRET_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 300

    # ⚠️ QUAN TRỌNG: Sửa dòng này để ưu tiên lấy từ ENV (Railway), nếu không có mới dùng localhost
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://admin:123456@localhost:5432/expense_tracker_app"
    )

    # Các biến khác
    FIREBASE_SERVICE_ACCOUNT: str = ""
    GOOGLE_API_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"  # Bỏ qua biến thừa để không lỗi


settings = Settings()