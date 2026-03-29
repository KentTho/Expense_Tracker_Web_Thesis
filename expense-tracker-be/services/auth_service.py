import uuid
from datetime import timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException
from cruds import crud_user
from core.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token

def sync_firebase_user(db: Session, decoded_token: dict, payload_email: str, payload_name: str, payload_picture: str):
    """Logic đồng bộ user từ Firebase sang DB nội bộ"""
    uid = decoded_token.get("uid")
    email = decoded_token.get("email") or payload_email
    name = payload_name or decoded_token.get("name")
    picture = payload_picture or decoded_token.get("picture")
    is_verified_firebase = decoded_token.get("email_verified", False)

    user = crud_user.get_user_by_firebase_uid(db, uid)
    if not user:
        user = crud_user.create_user(db, firebase_uid=uid, email=email, name=name, profile_image=picture)
    else:
        updated = False
        if email and user.email != email: user.email = email; updated = True
        if name and user.name != name: user.name = name; updated = True
        if picture and user.profile_image != picture: user.profile_image = picture; updated = True
        if user.is_email_verified != is_verified_firebase:
            user.is_email_verified = is_verified_firebase
            updated = True
        if updated:
            db.add(user); db.commit(); db.refresh(user)

    # Tạo Session Key mới (Đá session cũ)
    new_session_key = str(uuid.uuid4())
    user.last_session_key = new_session_key
    db.add(user); db.commit(); db.refresh(user)

    # Tạo JWT Token
    access_token = create_access_token(
        data={"sub": user.email, "id": str(user.id), "session_key": new_session_key},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}

def update_user_profile(db: Session, user, data):
    """Logic cập nhật profile và các ràng buộc bảo mật"""
    if data.name is not None: user.name = data.name
    if data.email is not None: user.email = data.email
    if data.profile_image is not None: user.profile_image = data.profile_image
    if data.gender is not None: user.gender = data.gender
    if data.birthday is not None: user.birthday = data.birthday
    if data.currency_code is not None: 
        user.currency_code = data.currency_code
        # Tự động gán symbol
        symbols = {"VND": "₫", "USD": "$", "EUR": "€"}
        user.currency_symbol = symbols.get(data.currency_code, data.currency_symbol or "$")

    if data.monthly_budget is not None: user.monthly_budget = data.monthly_budget
    if data.has_onboard is not None: user.has_onboard = data.has_onboard

    # Ràng buộc bảo mật Single Device
    if data.restrict_multi_device is not None:
        if data.restrict_multi_device is True and not user.is_2fa_enabled:
            raise HTTPException(status_code=400, detail="Security Requirement: You must enable 2FA before activating Single Device Mode.")
        user.restrict_multi_device = data.restrict_multi_device

    db.add(user)
    db.commit()
    db.refresh(user)
    return user
