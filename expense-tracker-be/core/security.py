# core/security.py
from datetime import datetime, timedelta
from typing import Optional

from django.conf.global_settings import SECRET_KEY  # Import sai! Django không dùng ở đây – xóa, dùng settings.SECRET_KEY.
from jose import jwt  # python-jose tốt.
from passlib.context import CryptContext
from core.config import settings  # Import config tốt.
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")  # Scheme chuẩn cho Bearer token.

# Cấu hình mã hóa mật khẩu (dùng bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")  # Bcrypt mạnh, auto-deprecate tốt.

# Biến này được auth_route.py import
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES  # Từ config – consistent.

def verify_password(plain_password, hashed_password):  # Verify tốt.
    """Kiểm tra mật khẩu nhập vào có khớp với mật khẩu đã mã hóa không"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):  # Hash tốt – dùng khi register user.
    """Mã hóa mật khẩu trước khi lưu vào DB"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):  # Create JWT tốt.
    """Tạo JWT Token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta  # UTC tốt cho timezone.
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)  # Default 15min, nhưng config là 30 – consistent?

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)  # Encode secure.
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), ALGORITHM=None):  # Dependency tốt cho routers.
    # Verify JWT or Firebase token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])  # Sai: SECRET_KEY từ django? Fix: settings.SECRET_KEY, settings.ALGORITHM.
        return payload.get("sub")  # Get user_id/email.
    except:
        raise HTTPException(401, "Invalid token")  # Raise 401 tốt.