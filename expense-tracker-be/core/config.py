# core/config.py
import json
import os
from typing import List
from pydantic_settings import BaseSettings  # Điểm mạnh: Pydantic-settings validate ENV tự động (e.g., type check int/str).

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

class Settings(BaseSettings):  # Inheritance tốt – dễ extend (e.g., thêm Redis URL sau).
    # Cấu hình cơ bản
    SECRET_KEY: str = "vantho2200006616"  # Default OK, nhưng production random generate (os.urandom(32)). Liên kết tiêu chí 1: JWT secret.
    ALGORITHM: str = "HS256"  # Symmetric OK, nhưng consider RS256 cho public/private keys (scale tốt hơn).
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Short expire tốt cho security (refresh token nếu cần long session).

    # ⚠️ QUAN TRỌNG: Sửa dòng này để ưu tiên lấy từ ENV (Railway), nếu không có mới dùng localhost
    DATABASE_URL: str = os.getenv(  # Smart: Prioritize ENV → cloud-friendly (tiêu chí 2/8).
        "DATABASE_URL",
        "postgresql://admin:123456@localhost:5432/expense_tracker_app"  # Local default tốt, nhưng password hardcode → xóa default, force ENV.
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    BACKEND_CORS_ORIGINS: str = ",".join(DEFAULT_CORS_ORIGINS)

    # Các biến khác
    FIREBASE_SERVICE_ACCOUNT: str = ""  # Optional tốt, nhưng add type Optional[str] nếu pydantic v2.
    GOOGLE_API_KEY: str = ""  # Cho Gemini – liên kết chat_route.
    GEMINI_API_KEY: str = ""

    @property
    def cors_origins(self) -> List[str]:
        raw_origins = (self.BACKEND_CORS_ORIGINS or "").strip()
        if not raw_origins:
            return DEFAULT_CORS_ORIGINS

        if raw_origins.startswith("["):
            try:
                parsed = json.loads(raw_origins)
                origins = [str(origin).strip() for origin in parsed if str(origin).strip()]
            except json.JSONDecodeError:
                origins = DEFAULT_CORS_ORIGINS
        else:
            origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

        origins = [origin for origin in origins if origin != "*"]
        return origins or DEFAULT_CORS_ORIGINS

    @property
    def google_genai_api_key(self) -> str:
        return self.GOOGLE_API_KEY or self.GEMINI_API_KEY

    class Config:  # Nested config tốt.
        env_file = ".env"  # Load from .env.
        extra = "ignore"  # Bỏ qua biến thừa để không lỗi  # Graceful, tránh crash nếu ENV thừa.

settings = Settings()  # Singleton instance – import everywhere (e.g., from core.config import settings).
