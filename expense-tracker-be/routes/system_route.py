# routes/system_route.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from services.auth_token_db import get_current_admin_user, get_current_user_db
from cruds import crud_system
from schemas import system_schemas

router = APIRouter(prefix="/system", tags=["System Settings"])

# API cho ADMIN: Cập nhật cài đặt
@router.put("/settings", response_model=system_schemas.SystemSettingsOut)
def update_settings(
    payload: system_schemas.SystemSettingsUpdate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin_user) # 🔒 Chỉ Admin
):
    return crud_system.update_system_settings(db, payload)

# API cho USER (và Admin): Xem cài đặt (để biết có bảo trì hay không, nhận thông báo)
@router.get("/settings", response_model=system_schemas.SystemSettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    # Cho phép user thường gọi để nhận thông báo Broadcast
    current_user = Depends(get_current_user_db)
):
    return crud_system.get_system_settings(db)