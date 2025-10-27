from fastapi import Depends, HTTPException, Header
from firebase_admin import auth as fb_auth
from sqlalchemy.orm import Session

import crud
from db.database import get_db


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
    # Debug (chỉ bật khi cần)
    # print("🔑 Extracted Token:", token[:20], "...")
    return token


# ----------------------
# Verify Token with Firebase
# ----------------------
def verify_token_and_get_payload(id_token: str):
    """Xác minh Firebase ID token và trả payload."""
    try:
        decoded = fb_auth.verify_id_token(id_token)
        # print("✅ Firebase token verified for UID:", decoded.get("uid"))
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
def get_current_user_db(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """
    Dependency: Verify Firebase token, ensure user exists in DB,
    and return the DB user object.
    """
    id_token = extract_token(authorization)
    payload = verify_token_and_get_payload(id_token)

    uid = payload.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token payload: uid missing")

    # Tìm user theo firebase_uid
    user = crud.get_user_by_firebase_uid(db, uid)

    # Nếu chưa tồn tại -> tự động tạo user
    if not user:
        email = payload.get("email") or f"user_{uid}@noemail.local"
        name = payload.get("name") or payload.get("displayName") or "Unnamed User"
        picture = payload.get("picture")
        user = crud.create_user(
            db,
            firebase_uid=uid,
            email=email,
            name=name,
            profile_image=picture
        )
        # print(f"🆕 User created automatically for UID: {uid}")

    return user