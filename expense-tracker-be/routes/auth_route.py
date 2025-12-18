# routes/auth_route.py
import uuid  # ✅ Đã thêm thư viện này
from datetime import timedelta
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse

from cruds import crud_user, crud_audit
from db.database import get_db
# ✅ Thêm Token vào import
from schemas import UserOut, UserSyncPayload, UserUpdate
from schemas.user_schemas import Token, SupportRequest
from services.auth_token_db import extract_token, verify_token_and_get_payload, get_current_user_db
from cruds.crud_user import get_user_by_email, create_user, get_user_by_firebase_uid, authenticate_user
from core.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token
from models import user_model

router = APIRouter(prefix="/auth", tags=["Auth"])


# --- API 1: SYNC VỚI FIREBASE ---
@router.post("/sync", response_model=Token)
def auth_sync(payload: UserSyncPayload,
              authorization: str = Header(...),
              db: Session = Depends(get_db)):
    id_token = extract_token(authorization)
    decoded = verify_token_and_get_payload(id_token)
    is_verified_firebase = decoded.get("email_verified", False)

    uid = decoded.get("uid")
    email = decoded.get("email") or payload.email
    name = payload.display_name or decoded.get("name")
    picture = decoded.get("picture")

    user = get_user_by_firebase_uid(db, uid)
    if not user:
        user = create_user(db, firebase_uid=uid, email=email, name=name, profile_image=picture)
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

    # ✅ TẠO SESSION KEY MỚI
    new_session_key = str(uuid.uuid4())
    user.last_session_key = new_session_key
    db.add(user); db.commit(); db.refresh(user)

    # ✅ TẠO TOKEN
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "id": str(user.id), "session_key": new_session_key},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer", "user": user}

# --- API 2: ĐĂNG NHẬP THƯỜNG ---
@router.post("/login_sync", response_model=Token)
def login_sync_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # ✅ TẠO SESSION KEY MỚI
    new_session_key = str(uuid.uuid4())
    user.last_session_key = new_session_key
    db.add(user); db.commit(); db.refresh(user)

    # ✅ TẠO TOKEN
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "id": str(user.id), "session_key": new_session_key},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer", "user": user}

# --- API 2: LẤY PROFILE ---
@router.get("/user/profile", response_model=UserOut)
def get_profile(current_user=Depends(get_current_user_db)):
    return current_user


# --- API 3: CẬP NHẬT PROFILE ---
@router.put("/user/profile", response_model=UserOut)
def update_profile(data: UserUpdate,
                   current_user=Depends(get_current_user_db),
                   db: Session = Depends(get_db)):
    user = current_user
    if data.restrict_multi_device is not None:
        user.restrict_multi_device = data.restrict_multi_device
    if data.name is not None: user.name = data.name
    if data.email is not None: user.email = data.email
    if data.profile_image is not None: user.profile_image = data.profile_image
    if data.gender is not None: user.gender = data.gender
    if data.birthday is not None: user.birthday = data.birthday
    if data.currency_code is not None: user.currency_code = data.currency_code

    if user.currency_code == "VND":
        user.currency_symbol = "₫"
    elif user.currency_code == "USD":
        user.currency_symbol = "$"
    elif data.currency_symbol is not None:
        user.currency_symbol = data.currency_symbol

    if data.monthly_budget is not None: user.monthly_budget = data.monthly_budget
    if data.has_onboard is not None: user.has_onboard = data.has_onboard

    # ✅ LOGIC MỚI: RÀNG BUỘC 2FA KHI BẬT SINGLE DEVICE MODE
    if data.restrict_multi_device is not None:
        # Nếu người dùng muốn BẬT (True) tính năng này
        if data.restrict_multi_device is True:
            # Kiểm tra xem 2FA đã bật chưa
            if not user.is_2fa_enabled:
                raise HTTPException(
                    status_code=400,
                    detail="Security Requirement: You must enable 2FA before activating Single Device Mode."
                )

        # Nếu thỏa mãn (hoặc là tắt đi), thì mới cho cập nhật
        user.restrict_multi_device = data.restrict_multi_device

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/api/public/support-request")
async def submit_support_request(
        req: SupportRequest,
        request: Request,  # 👈 Thêm biến request để lấy IP
        db: Session = Depends(get_db)
):
    try:
        # Kiểm tra user
        user = crud_user.get_user_by_email(db, req.email)
        if not user:
            return JSONResponse(
                status_code=404,
                content={"message": "Email này chưa được đăng ký trong hệ thống."}
            )

        # Lấy IP người dùng (nếu chạy local có thể là 127.0.0.1)
        client_ip = request.client.host if request.client else "Unknown"

        # Ghi Log
        # Lưu ý: Nếu hàm log_action của bạn không nhận ip_address, hãy xóa dòng ip_address=... đi
        crud_audit.log_action(
            db=db,
            actor_email=req.email,
            action="SOS_REQUEST",
            target="ADMIN_CENTER",
            details=f"[{req.issue_type}] {req.message}",
            status="PENDING",
            ip_address=client_ip  # 👈 Bổ sung IP để tránh lỗi thiếu trường trong DB
        )

        return {"message": "Đã gửi yêu cầu thành công! Admin sẽ xử lý sớm."}

    except Exception as e:
        # In lỗi chi tiết ra Terminal để bạn nhìn thấy (Quan trọng)
        print(f"❌ LỖI API SUPPORT: {str(e)}")

        # Trả về lỗi cho Frontend
        return JSONResponse(
            status_code=500,
            content={"message": f"Lỗi hệ thống: {str(e)}"}
        )
@router.get("/me", response_model=UserOut)
def get_me(current_user=Depends(get_current_user_db)):
    return current_user