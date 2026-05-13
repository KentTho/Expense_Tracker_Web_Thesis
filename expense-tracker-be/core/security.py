# core/security.py
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import jwt  # python-jose tốt.
from core.config import settings  # Import config tốt.
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login_sync")  # Scheme chuẩn cho Bearer token.

# Biến này được auth_route.py import
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES  # Từ config – consistent.

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
        expire = datetime.utcnow() + timedelta(minutes=15)  # Default 15min, nhưng config là 30 – consistent?

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)  # Encode secure.
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), ALGORITHM=None):  # Dependency tốt cho routers.
    # Verify JWT or Firebase token
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")  # Get user_id/email.
    except:
        raise HTTPException(401, "Invalid token")  # Raise 401 tốt.
