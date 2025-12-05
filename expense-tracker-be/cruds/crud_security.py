# cruds/crud_security.py (TẠO MỚI)
from langgraph_sdk.auth.exceptions import HTTPException
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

    # Tạo một secret key mới
    secret = pyotp.random_base32()
    user.otp_secret = secret  # Tạm thời lưu secret (NÊN MÃ HÓA TRƯỚC KHI LƯU)
    db.commit()

    # Tạo URL cho mã QR (ví dụ: otpauth://totp/ExpenseApp:user@email.com?secret=SECRETKEY&issuer=ExpenseApp)
    # Cần lấy email user
    qr_url = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user.email,  # Giả sử bạn có user.email
        issuer_name="ExpenseTrackerApp"
    )

    return {"secret": secret, "qr_url": qr_url}


def enable_2fa_verify_code(db: Session, user_id: UUID, code: str):
    """Xác thực mã 2FA và kích hoạt"""
    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not user or not user.otp_secret:
        raise Exception("2FA is not being set up or user not found")

    totp = pyotp.TOTP(user.otp_secret)
    if totp.verify(code, valid_window=1):
        # Xác thực thành công
        user.is_2fa_enabled = True
        db.commit()
        return True
    else:
        # Xác thực thất bại
        return False

def verify_login_2fa(db: Session, user_id: UUID, code: str):
    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()

    if not user or not user.is_2fa_enabled:
        return True
    if not user.otp_secret:
        raise HTTPException(status_code=400, detail="2FA is enabled but no secret found. Please contact admin")

    totp = pyotp.TOTP(user.otp_secret)
    if totp.verify(code):
        return True
    else:
        raise HTTPException(status_code=400, detail="Invalid 2FA COde")