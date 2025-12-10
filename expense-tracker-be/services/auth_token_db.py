# services/auth_token_db.py (Đã sửa lỗi Import)
from core.config import settings
from fastapi import Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordBearer
from firebase_admin import auth as fb_auth
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from starlette import status

from cruds.crud_user import create_user, get_user_by_firebase_uid
from db.database import get_db
from models import user_model
# ✅ SỬA LỖI Ở ĐÂY: Import User từ user_model
from models.user_model import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login_sync")

# -------------------------------------------------
# Auth helpers
# -------------------------------------------------
# ----------------------
# Extract Token
# ----------------------
def extract_token(authorization: str) -> str:
    """Lấy token từ header Bearer."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=400, detail="Invalid Authorization header format")
    token = authorization.split(" ", 1)[1]
    return token


# ----------------------
# Verify Token with Firebase
# ----------------------
def verify_token_and_get_payload(id_token: str):
    """Xác minh Firebase ID token và trả payload."""
    try:
        decoded = fb_auth.verify_id_token(id_token)
        return decoded
    except fb_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except fb_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")
    except fb_auth.RevokedIdTokenError:
        raise HTTPException(status_code=401, detail="Token has been revoked")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


# ----------------------
# Dependency: get current user
# ----------------------
def get_current_user_db(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Giải mã Token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        token_session_key: str = payload.get("session_key")  # Lấy key từ token

        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Tìm user trong DB
    user = db.query(user_model.User).filter(user_model.User.email == email).first()
    if user is None:
        raise credentials_exception

    # ============================================================
    # ✅ LOGIC SINGLE DEVICE MODE (CHỈ KÍCH HOẠT NẾU USER BẬT)
    # ============================================================
    if user.restrict_multi_device:  # Nếu user đã bật chức năng này
        # Kiểm tra xem key trong token có khớp với key mới nhất trong DB không
        if token_session_key != user.last_session_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired. You have logged in on another device.",  # Thông báo bị đá
                headers={"WWW-Authenticate": "Bearer"},
            )

    return user

# ----------------------
# Dependency: get current ADMIN
# ----------------------
def get_current_admin_user(current_user: User = Depends(get_current_user_db)):
    """
    Dependency mới:
    Kiểm tra xem người dùng hiện tại có phải là Admin không.
    Nếu không, ném lỗi 403 Forbidden.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Administrator access required"
        )
    return current_user