# routes/security_route.py (TẠO MỚI)
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any

from db.database import get_db
from services.auth_token_db import get_current_user_db
from schemas.security_schemas import (
    SecuritySettingsOut,
    SecuritySettingsUpdate,
    Verify2FALoginPending,
)
from cruds import crud_security

router = APIRouter(prefix="/security", tags=["Security"])

# === API CHÍNH CHO CÁC NÚT BẬT/TẮT ===

@router.get("/settings", response_model=SecuritySettingsOut)
def get_security_settings(
    current_user=Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    """Lấy cài đặt bảo mật hiện tại (2FA, Giới hạn thiết bị)"""
    settings = crud_security.get_user_security_settings(db, current_user.id)
    if not settings:
        raise HTTPException(status_code=404, detail="User settings not found")
    return settings


@router.put("/settings", response_model=SecuritySettingsOut)
def update_security_settings(
    settings: SecuritySettingsUpdate,
    current_user=Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    """Cập nhật cài đặt bảo mật (2FA, Giới hạn thiết bị)"""
    # LƯU Ý: Tắt 2FA nên yêu cầu mật khẩu hoặc mã 2FA,
    # nhưng để đơn giản, chúng ta cho phép cập nhật trực tiếp
    if settings.is_2fa_enabled is True:
        # Nếu đang muốn bật 2FA, kiểm tra xem Email đã verify chưa
        if not current_user.is_email_verified:
            raise HTTPException(
                status_code=400,
                detail="Email Verification Required: Please verify your email before enabling 2FA."
            )
    updated_settings = crud_security.update_user_security_settings(db, current_user.id, settings)
    if not updated_settings:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_settings


# === API CHO QUÁ TRÌNH KÍCH HOẠT 2FA ===

@router.post("/2fa/enable-start", response_model=Dict[str, str])
def start_enabling_2fa(
    current_user=Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    """Bước 1: Tạo secret key và QR code URL để user quét"""
    try:
        data = crud_security.enable_2fa_generate_secret(db, current_user.id)
        # FE sẽ nhận data = {"secret": "...", "qr_url": "..."} và hiển thị QR code
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/2fa/enable-verify", response_model=Dict[str, bool])
def verify_enabling_2fa(
    code: str = Body(..., embed=True), # Nhận mã code từ user
    current_user=Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    """Bước 2: User nhập mã từ app, BE xác thực và kích hoạt 2FA"""
    try:
        is_valid = crud_security.enable_2fa_verify_code(db, current_user.id, code)
        if is_valid:
            return {"success": True}
        else:
            raise HTTPException(status_code=400, detail="Invalid 2FA code")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/2fa/login-verify")
def verify_login_2fa_route(
    payload: Verify2FALoginPending,
    db: Session = Depends(get_db)
):
    """Verify OTP với pending_token, chỉ sau đó mới cấp full access JWT."""
    from core.config import settings
    from jose import jwt, JWTError
    from core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
    from datetime import timedelta

    from models.user_model import User

    try:
        decoded = jwt.decode(payload.pending_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid pending token")

    if decoded.get("token_use") != "pending_2fa":
        raise HTTPException(status_code=401, detail="Invalid token purpose")

    user_id = decoded.get("id")
    try:
        # crud_security.verify_login_2fa cần UUID kiểu python
        user_id = str(user_id)
    except Exception:
        pass

    session_key = decoded.get("session_key")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid pending token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if user.is_2fa_enabled != True:
        raise HTTPException(status_code=400, detail="2FA not enabled")


    crud_security.verify_login_2fa(db, user.id, payload.code)

    access_token = create_access_token(
        data={"sub": user.email, "id": str(user.id), "session_key": session_key, "token_use": "access"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "requires_2fa": False,
        "user": {"id": str(user.id), "email": user.email},
    }

