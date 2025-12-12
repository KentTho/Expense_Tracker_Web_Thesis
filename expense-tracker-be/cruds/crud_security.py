# cruds/crud_security.py (TẠO MỚI)
from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from models import user_model  # Giả sử model User của bạn ở đây
from schemas.security_schemas import SecuritySettingsUpdate
# --- Logic cho 2FA (Sẽ phức tạp hơn, đây là bản cơ bản) ---
# Bạn sẽ cần thư viện: pip install pyotp
import pyotp



def get_user_security_settings(db: Session, user_id: UUID):
    """Lấy cài đặt bảo mật hiện tại của user"""
    user = db.query(
        user_model.User.is_2fa_enabled,
        user_model.User.restrict_multi_device
    ).filter(user_model.User.id == user_id).first()

    if not user:
        return None
    return user  # Trả về Row object, Pydantic sẽ tự map


def update_user_security_settings(db: Session, user_id: UUID, settings: SecuritySettingsUpdate):
    """Cập nhật cài đặt bảo mật cho user"""
    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not user:
        return None

    update_data = settings.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


def enable_2fa_generate_secret(db: Session, user_id: UUID):
    """Tạo secret key MỚI cho user (chưa kích hoạt)"""
    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not user:
        raise Exception("User not found")

    secret = pyotp.random_base32()
    user.otp_secret = secret
    db.commit()

    qr_url = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user.email,
        issuer_name="ExpenseTrackerApp"
    )
    return {"secret": secret, "qr_url": qr_url}


def enable_2fa_verify_code(db: Session, user_id: UUID, code: str):
    """Xác thực mã 2FA và kích hoạt"""
    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not user or not user.otp_secret:
        raise Exception("2FA setup not initiated")

    totp = pyotp.TOTP(user.otp_secret)
    # Đã có valid_window=1 ở đây là TỐT
    if totp.verify(code, valid_window=1):
        user.is_2fa_enabled = True
        db.commit()
        return True
    else:
        return False


def verify_login_2fa(db: Session, user_id: UUID, code: str):
    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()

    if not user or not user.is_2fa_enabled:
        return True
    if not user.otp_secret:
        raise HTTPException(status_code=400, detail="2FA is enabled but no secret found.")

    totp = pyotp.TOTP(user.otp_secret)

    # 🔴 LỖI Ở ĐÂY: Bạn thiếu valid_window=1
    # ✅ SỬA THÀNH:
    if totp.verify(code, valid_window=1):
        return True
    else:
        raise HTTPException(status_code=400, detail="Invalid 2FA Code")