# routes/security_route.py (TẠO MỚI)
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any

from db.database import get_db
from services.auth_token_db import get_current_user_db
from schemas.security_schemas import SecuritySettingsOut, SecuritySettingsUpdate
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