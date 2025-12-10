# core/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from core.config import settings

# Cấu hình mã hóa mật khẩu (dùng bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Biến này được auth_route.py import
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES


def verify_password(plain_password, hashed_password):
    """Kiểm tra mật khẩu nhập vào có khớp với mật khẩu đã mã hóa không"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Mã hóa mật khẩu trước khi lưu vào DB"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Tạo JWT Token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt