from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from db.database import get_db
from schemas import UserOut, UserSyncPayload, UserUpdate
from services.auth_token_db import extract_token, verify_token_and_get_payload, get_current_user_db
from cruds.crud_user import get_user_by_email, create_user, get_user_by_firebase_uid
router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/sync", response_model=UserOut)
def auth_sync(payload: UserSyncPayload,
              authorization: str = Header(...),
              db: Session = Depends(get_db)):
    id_token = extract_token(authorization)
    decoded = verify_token_and_get_payload(id_token)

    uid = decoded.get("uid")
    email = decoded.get("email") or payload.email
    name = payload.display_name or decoded.get("name")
    picture = decoded.get("picture")

    user = get_user_by_firebase_uid(db, uid)
    if not user:
        user = create_user(db,
                           firebase_uid=uid,
                           email=email,
                           name=name,
                           profile_image=picture
                           )
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

@router.get("/user/profile", response_model=UserOut)
def get_profile(current_user = Depends(get_current_user_db)):
    return current_user

@router.put("/user/profile", response_model=UserOut)
def update_profile(data: UserUpdate,
                   current_user = Depends(get_current_user_db),
                   db: Session = Depends(get_db)):
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
    if data.currency_code is not None:
        user.currency_code = data.currency_code
    if data.currency_symbol is not None:
        user.currency_symbol = data.currency_symbol
    if data.monthly_budget is not None:
        user.monthly_budget = data.monthly_budget

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/me", response_model=UserOut)
def get_me(current_user = Depends(get_current_user_db)):
    return current_user
