import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse

from cruds import crud_user, crud_audit
from db.database import get_db
from schemas import UserOut, UserSyncPayload, UserUpdate, Token, SupportRequest
from services import auth_service
from services.auth_token_db import extract_token, verify_token_and_get_payload, get_current_user_db
from core.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/sync", response_model=Token)
def auth_sync(payload: UserSyncPayload, authorization: str = Header(...), db: Session = Depends(get_db)):
    """API đồng bộ với Firebase và nhận JWT nội bộ."""
    id_token = extract_token(authorization)
    decoded = verify_token_and_get_payload(id_token)
    return auth_service.sync_firebase_user(db, decoded, payload.email, payload.display_name, payload.picture if hasattr(payload, 'picture') else None)

@router.post("/login_sync", response_model=Token)
def login_sync_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Đăng nhập bằng email/password nội bộ."""
    user = crud_user.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    new_session_key = str(uuid.uuid4())
    user.last_session_key = new_session_key
    db.add(user); db.commit(); db.refresh(user)

    access_token = create_access_token(
        data={"sub": user.email, "id": str(user.id), "session_key": new_session_key},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/user/profile", response_model=UserOut)
def get_profile(current_user=Depends(get_current_user_db)):
    return current_user

@router.put("/user/profile", response_model=UserOut)
def update_profile(data: UserUpdate, current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    """Cập nhật profile qua auth_service."""
    return auth_service.update_user_profile(db, current_user, data)

@router.post("/api/public/support-request")
async def submit_support_request(req: SupportRequest, request: Request, db: Session = Depends(get_db)):
    try:
        user = crud_user.get_user_by_email(db, req.email)
        if not user:
            return JSONResponse(status_code=404, content={"message": "Email này chưa được đăng ký."})

        client_ip = request.client.host if request.client else "Unknown"
        crud_audit.log_action(db, actor_email=req.email, action="SOS_REQUEST", target="ADMIN", 
                              details=f"[{req.issue_type}] {req.message}", status="PENDING", ip_address=client_ip)
        return {"message": "Gửi thành công! Admin sẽ xử lý sớm."}
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Lỗi hệ thống: {str(e)}"})

@router.get("/me", response_model=UserOut)
def get_me(current_user=Depends(get_current_user_db)):
    return current_user
