# core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 1. Cấu hình cơ bản (Có thể set mặc định ở đây)
    SECRET_KEY: str = "YOUR_SECRET_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 300
    DATABASE_URL: str = "postgresql://admin:123456@localhost:5432/expense_tracker_app"

    # 2. ✅ BỔ SUNG TÊN BIẾN (Quan trọng)
    # Bạn chỉ cần khai báo tên, không cần copy giá trị dài dòng từ .env vào đây.
    # Pydantic sẽ tự động lấy từ file .env cho bạn.
    FIREBASE_SERVICE_ACCOUNT: str = ""
    GOOGLE_API_KEY: str = ""

    class Config:
        env_file = ".env"
        # 3. ✅ THÊM DÒNG NÀY:
        # Để nếu file .env có biến thừa nào đó, code cũng không bị lỗi
        extra = "ignore"

settings = Settings()