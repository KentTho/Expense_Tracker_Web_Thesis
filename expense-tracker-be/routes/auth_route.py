from main import get_db, app
from schemas import (  # your file is named schema.py per your last message
    UserOut, UserSyncPayload, UserUpdate
)
from services.auth_token_db import extract_token, verify_token_and_get_payload, get_current_user_db
from fastapi import Depends, Header
from sqlalchemy.orm import Session

# ----------------------
# USER ROUTES
# ----------------------
@app.post("/auth/sync", response_model=UserOut)
def auth_sync(payload: UserSyncPayload, authorization: str = Header(...), db: Session = Depends(get_db)):
    """
    Đồng bộ user giữa Firebase và DB (explicit sync route).
    FE should send Authorization: Bearer <idToken> and payload (email, firebase_uid, display_name)
    """
    id_token = extract_token(authorization)
    decoded = verify_token_and_get_payload(id_token)

    uid = decoded.get("uid")
    email = decoded.get("email") or payload.email
    name = payload.display_name or decoded.get("name")
    picture = decoded.get("picture")

    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        user = crud.create_user(db, firebase_uid=uid, email=email, name=name, profile_image=picture)
    else:
        updated = False
        if email and user.email != email:
            user.email = email; updated = True
        if name and user.name != name:
            user.name = name; updated = True
        if picture and user.profile_image != picture:
            user.profile_image = picture; updated = True
        if updated:
            db.add(user)
            db.commit()
            db.refresh(user)
    return user

@app.get("/auth/user/profile", response_model=UserOut)
def get_profile(current_user = Depends(get_current_user_db)):
    """Lấy thông tin hồ sơ người dùng."""
    return current_user

@app.put("/auth/user/profile", response_model=UserOut)
def update_profile(data: UserUpdate, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    """Cập nhật hồ sơ người dùng."""
    user = current_user
    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        user.email = data.email
    if data.profile_image is not None:
        user.profile_image = data.profile_image
    if data.gender is not None:
        user.gender = data.gender
    if data.birthday is not None:
        user.birthday = data.birthday

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.get("/me", response_model=UserOut)
def get_me(current_user = Depends(get_current_user_db)):
    """Trả về thông tin người dùng hiện tại."""
    return current_user
