# routes/admin_route.py (Đã sắp xếp và cập nhật)

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from db.database import get_db
from services.auth_token_db import get_current_admin_user # Dùng "gác cổng" Admin
from models import user_model # Import model
from cruds import crud_admin
from schemas import admin_schemas, category_schemas, user_schemas

# Tất cả API trong file này đều yêu cầu quyền Admin
router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin_user)]
)

# =========================================================
# 1. ADMIN STATS ROUTES
# =========================================================

@router.get("/stats/kpis", response_model=admin_schemas.AdminGlobalKPIs)
def get_admin_kpis(db: Session = Depends(get_db)):
    """[Admin] Lấy KPI toàn hệ thống (Users, Income, Expense)"""
    return crud_admin.admin_get_global_kpis(db)


@router.get("/stats/user-growth", response_model=List[admin_schemas.AdminUserGrowth])
def get_admin_user_growth(days: int = 30, db: Session = Depends(get_db)):
    """[Admin] Lấy biểu đồ tăng trưởng người dùng mới"""
    return crud_admin.admin_get_user_growth(db, days=days)


# =========================================================
# 2. USER MANAGEMENT ROUTES
# =========================================================

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


@router.delete("/users/{user_id}")
def delete_user_by_admin(user_id: UUID, db: Session = Depends(get_db)):
    """[Admin] Xóa một User (Xóa CSDL và Firebase Auth)"""
    user = crud_admin.admin_get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # Gọi hàm CRUD (đã bao gồm commit)
        crud_admin.admin_delete_user(db, user)
        return {"message": f"User {user.email} and all related data deleted successfully."}
    except Exception as e:
        # Nếu Firebase lỗi, CRUD sẽ ném lỗi.
        # Chúng ta bắt lỗi đó và trả về 500
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete user: {str(e)}"
        )


# =========================================================
# 3. DEFAULT CATEGORY MANAGEMENT ROUTES
# =========================================================

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
        # Sửa lỗi 44 -> 404
        raise HTTPException(status_code=404, detail="Default category not found")

    # TODO: Cần kiểm tra xem category này có đang được sử dụng không trước khi xóa
    crud_admin.admin_delete_default_category(db, category)
    return Response(status_code=status.HTTP_204_NO_CONTENT)