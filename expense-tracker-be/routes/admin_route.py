# routes/admin_route.py
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from db.database import get_db
from services.auth_token_db import get_current_admin_user
from models import user_model
from cruds import crud_admin, crud_audit  # ✅ Import CRUD Audit
from schemas import admin_schemas, category_schemas, user_schemas, audit_schemas

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin_user)]
)


# --- Admin Stats ---
@router.get("/stats/kpis", response_model=admin_schemas.AdminGlobalKPIs)
def get_admin_kpis(db: Session = Depends(get_db)):
    return crud_admin.admin_get_global_kpis(db)


@router.get("/stats/user-growth", response_model=List[admin_schemas.AdminUserGrowth])
def get_admin_user_growth(days: int = 30, db: Session = Depends(get_db)):
    return crud_admin.admin_get_user_growth(db, days=days)


# --- Audit Logs ---
@router.get("/logs", response_model=List[audit_schemas.AuditLogOut])
def get_system_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_audit.get_audit_logs(db, skip=skip, limit=limit)


# =========================================================
# 👥 USER MANAGEMENT (CÓ GHI LOG SỬA/XÓA)
# =========================================================

@router.get("/users", response_model=List[admin_schemas.AdminUserListOut])
def get_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_admin.admin_get_all_users(db, skip=skip, limit=limit)


# ✅ HÀM UPDATE USER: ĐÃ BỔ SUNG GHI LOG
@router.put("/users/{user_id}", response_model=user_schemas.UserOut)
def update_user_by_admin(
        user_id: UUID,
        update_data: admin_schemas.AdminUserUpdate,
        request: Request,  # 👈 Lấy IP
        current_admin=Depends(get_current_admin_user),  # 👈 Lấy người thực hiện
        db: Session = Depends(get_db)
):
    """[Admin] Cập nhật User (Cấp quyền, Đổi tên...) và Ghi Log"""
    user = crud_admin.admin_get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Lưu thông tin cũ để so sánh
    old_is_admin = user.is_admin
    target_email = user.email

    try:
        updated_user = crud_admin.admin_update_user(db, user, update_data)

        # --- Logic tạo nội dung Log thông minh ---
        log_details = []
        if update_data.is_admin is not None and update_data.is_admin != old_is_admin:
            action_type = "GRANT_ADMIN" if update_data.is_admin else "REVOKE_ADMIN"
            log_details.append(f"Changed Admin privileges to {update_data.is_admin}")
        else:
            action_type = "UPDATE_USER"
            log_details.append("Updated profile information")

        details_msg = ", ".join(log_details)

        # Ghi Log
        crud_audit.create_audit_log(
            db=db,
            action=action_type,  # VD: GRANT_ADMIN hoặc UPDATE_USER
            actor_email=current_admin.email,
            target=target_email,
            status="SUCCESS",
            details=details_msg,
            ip_address=request.client.host
        )
        return updated_user
    except Exception as e:
        # Ghi Log Lỗi
        crud_audit.create_audit_log(
            db=db,
            action="UPDATE_USER",
            actor_email=current_admin.email,
            target=target_email,
            status="ERROR",
            details=str(e),
            ip_address=request.client.host
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
def delete_user_by_admin(
        user_id: UUID,
        request: Request,
        current_admin=Depends(get_current_admin_user),
        db: Session = Depends(get_db)
):
    """[Admin] Xóa User và Ghi Log"""
    user = crud_admin.admin_get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    target_email = user.email

    try:
        success, message = crud_admin.admin_delete_user(db, user)

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


# =========================================================
# 🛡️ CATEGORY MANAGEMENT (CÓ GHI LOG)
# =========================================================

@router.get("/categories", response_model=List[category_schemas.CategoryOut])
def get_default_categories(type: Optional[str] = Query(None, enum=["income", "expense"]),
                           db: Session = Depends(get_db)):
    return crud_admin.admin_get_default_categories(db, type_filter=type)


@router.post("/categories", response_model=category_schemas.CategoryOut, status_code=status.HTTP_201_CREATED)
def create_default_category(
        payload: category_schemas.CategoryCreate,
        request: Request,
        current_admin=Depends(get_current_admin_user),
        db: Session = Depends(get_db)
):
    try:
        new_cat = crud_admin.admin_create_default_category(db, payload)
        crud_audit.create_audit_log(
            db=db,
            action="CREATE_CATEGORY",
            actor_email=current_admin.email,
            target=new_cat.name,
            status="SUCCESS",
            details=f"Created default category '{new_cat.name}' ({new_cat.type})",
            ip_address=request.client.host
        )
        return new_cat
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/categories/{category_id}", response_model=category_schemas.CategoryOut)
def update_default_category(
        category_id: UUID,
        payload: category_schemas.CategoryCreate,
        request: Request,
        current_admin=Depends(get_current_admin_user),
        db: Session = Depends(get_db)
):
    category = crud_admin.admin_get_default_category_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Default category not found")

    old_name = category.name
    try:
        updated_cat = crud_admin.admin_update_default_category(db, category, payload)
        crud_audit.create_audit_log(
            db=db,
            action="UPDATE_CATEGORY",
            actor_email=current_admin.email,
            target=updated_cat.name,
            status="SUCCESS",
            details=f"Renamed from '{old_name}'",
            ip_address=request.client.host
        )
        return updated_cat
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_default_category(
        category_id: UUID,
        request: Request,
        current_admin=Depends(get_current_admin_user),
        db: Session = Depends(get_db)
):
    category = crud_admin.admin_get_default_category_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Default category not found")

    target_name = category.name
    try:
        crud_admin.admin_delete_default_category(db, category)
        crud_audit.create_audit_log(
            db=db,
            action="DELETE_CATEGORY",
            actor_email=current_admin.email,
            target=target_name,
            status="SUCCESS",
            details="Deleted default category",
            ip_address=request.client.host
        )
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))