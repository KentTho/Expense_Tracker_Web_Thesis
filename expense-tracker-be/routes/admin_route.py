# routes/admin_route.py
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from db.database import get_db
from services.auth_token_db import get_current_admin_user  # 👈 DÙNG "GÁC CỔNG" ADMIN
from models import user_model  # Import model
from cruds import crud_admin, crud_audit # ✅ IMPORT CRUD AUDIT
from schemas import admin_schemas, category_schemas, user_schemas, audit_schemas

# ✅ Tất cả API trong file này đều yêu cầu quyền Admin
router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin_user)]
)


# --- Admin Stats ---

@router.get("/stats/kpis", response_model=admin_schemas.AdminGlobalKPIs)
def get_admin_kpis(db: Session = Depends(get_db)):
    """[Admin] Lấy KPI toàn hệ thống (Users, Income, Expense)"""
    return crud_admin.admin_get_global_kpis(db)


@router.get("/stats/user-growth", response_model=List[admin_schemas.AdminUserGrowth])
def get_admin_user_growth(days: int = 30, db: Session = Depends(get_db)):
    """[Admin] Lấy biểu đồ tăng trưởng người dùng mới"""
    return crud_admin.admin_get_user_growth(db, days=days)


# --- User Management ---

@router.get("/users", response_model=List[admin_schemas.AdminUserListOut])
def get_all_users(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """[Admin] Lấy danh sách tất cả người dùng"""
    users = crud_admin.admin_get_all_users(db, skip=skip, limit=limit)
    return users


@router.put("/users/{user_id}", response_model=user_schemas.UserOut)
def update_user_by_admin(
        user_id: UUID,
        update_data: admin_schemas.AdminUserUpdate,
        db: Session = Depends(get_db)
):
    """[Admin] Cập nhật thông tin User (VD: gán quyền Admin)"""
    user = crud_admin.admin_get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user = crud_admin.admin_update_user(db, user, update_data)
    return updated_user


# ✅ HÀM DELETE MỚI (CÓ GHI LOG) - CHỈ GIỮ LẠI HÀM NÀY
@router.delete("/users/{user_id}")
def delete_user_by_admin(
        user_id: UUID,
        request: Request,  # ✅ Lấy IP người dùng
        current_admin=Depends(get_current_admin_user),  # ✅ Lấy thông tin Admin đang xóa
        db: Session = Depends(get_db)
):
    """[Admin] Xóa User và Ghi Log"""
    user = crud_admin.admin_get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    target_email = user.email  # Lưu email nạn nhân để ghi log

    try:
        # 1. Xóa User (Hàm này trong crud_admin phải trả về tuple (success, message))
        success, message = crud_admin.admin_delete_user(db, user)

        # 2. ✅ GHI LOG THÀNH CÔNG
        crud_audit.create_audit_log(
            db=db,
            action="DELETE_USER",
            actor_email=current_admin.email,
            target=target_email,
            status="SUCCESS",
            details=message,
            ip_address=request.client.host
        )
        return {"message": message}

    except Exception as e:
        # 3. ✅ GHI LOG THẤT BẠI
        crud_audit.create_audit_log(
            db=db,
            action="DELETE_USER",
            actor_email=current_admin.email,
            target=target_email,
            status="ERROR",
            details=str(e),
            ip_address=request.client.host
        )
        raise HTTPException(status_code=500, detail=str(e))


# --- Default Category Management ---

@router.get("/categories", response_model=List[category_schemas.CategoryOut])
def get_default_categories(
        type: Optional[str] = Query(None, enum=["income", "expense"]),
        db: Session = Depends(get_db)
):
    """[Admin] Lấy danh sách các danh mục MẶC ĐỊNH (user_id IS NULL)"""
    return crud_admin.admin_get_default_categories(db, type_filter=type)


@router.post("/categories", response_model=category_schemas.CategoryOut, status_code=status.HTTP_201_CREATED)
def create_default_category(
        payload: category_schemas.CategoryCreate,
        db: Session = Depends(get_db)
):
    """[Admin] Tạo một danh mục mặc định mới"""
    return crud_admin.admin_create_default_category(db, payload)


@router.put("/categories/{category_id}", response_model=category_schemas.CategoryOut)
def update_default_category(
        category_id: UUID,
        payload: category_schemas.CategoryCreate,
        db: Session = Depends(get_db)
):
    """[Admin] Cập nhật một danh mục mặc định"""
    category = crud_admin.admin_get_default_category_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Default category not found")
    return crud_admin.admin_update_default_category(db, category, payload)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_default_category(
        category_id: UUID,
        db: Session = Depends(get_db)
):
    """[Admin] Xóa một danh mục mặc định"""
    category = crud_admin.admin_get_default_category_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Default category not found")

    crud_admin.admin_delete_default_category(db, category)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# ✅ BỔ SUNG ĐOẠN NÀY ĐỂ FIX LỖI 404 AUDIT LOGS
@router.get("/logs", response_model=List[audit_schemas.AuditLogOut])
def get_system_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """[Admin] Xem nhật ký hoạt động hệ thống"""
    # Hàm crud_audit.get_audit_logs cần được import từ cruds
    return crud_audit.get_audit_logs(db, skip=skip, limit=limit)