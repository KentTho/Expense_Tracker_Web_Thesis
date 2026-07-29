# core/security.py
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import jwt  # python-jose tốt.
from core.config import settings  # Import config tốt.

# F15 — re-export authority hết hạn token cho auth_route/auth_service/security_route import.
# Nguồn gốc DUY NHẤT: settings.ACCESS_TOKEN_EXPIRE_MINUTES (core/config.py).
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

def _password_bytes(password: str) -> bytes:
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        raise ValueError("Password is too long for bcrypt")
    return password_bytes

def verify_password(plain_password, hashed_password):  # Verify tốt.
    """Kiểm tra mật khẩu nhập vào có khớp với mật khẩu đã mã hóa không"""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(_password_bytes(plain_password), hashed_password.encode("utf-8"))
    except (TypeError, ValueError):
        return False

def get_password_hash(password):  # Hash tốt – dùng khi register user.
    """Mã hóa mật khẩu trước khi lưu vào DB"""
    return bcrypt.hashpw(_password_bytes(password), bcrypt.gensalt()).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):  # Create JWT tốt.
    """Tạo JWT Token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta  # UTC tốt cho timezone.
    else:
        # F15: fallback dùng CHUNG một authority với config (không còn số 15 rời rạc).
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)  # Encode secure.
    return encoded_jwt

# F6: legacy get_current_user (bare `except:`, trả token 'sub' thô) đã bị XOÁ.
# Toàn bộ 11 route dùng services.auth_token_db.get_current_user_db — đây là authority DUY NHẤT.
