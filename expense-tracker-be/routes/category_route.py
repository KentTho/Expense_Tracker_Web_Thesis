from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID, uuid4
from cruds.crud_category import (
    create_category as crud_create_category,
    delete_category as crud_delete_category,
    update_category as crud_update_category,
    list_all_categories_for_user # ✅ Import hàm mới
)
from db.database import get_db
from schemas import CategoryCreate, CategoryOut
from services.auth_token_db import get_current_user_db
router = APIRouter(prefix="/categories", tags=["Category"])

@router.post("/", response_model=CategoryOut)
def create_category(
    payload: CategoryCreate,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    category = crud_create_category(
        db=db,
        user_id=current_user.id,
        name=payload.name,
        type=payload.type,
        icon=payload.icon,
        color=payload.color,
    )
    return category


# ✅ SỬA HOÀN TOÀN: CHỈ DÙNG CategoryOut VÀ LẤY DATA TỪ DB
@router.get("/", response_model=List[CategoryOut])
def list_categories(
    type: Optional[str] = None,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách Category của User VÀ Default Category (từ DB) dưới dạng thống nhất CategoryOut.
    """
    # Gọi hàm mới để lấy data từ DB (có UUID thật)
    return list_all_categories_for_user(db, current_user.id, type_filter=type)


# ❌ XÓA BỎ ROUTE NÀY: Nó là dư thừa và gây lỗi data (tự sinh ID tạm thời)
@router.get("/default/{type}")
def get_default_categories_deprecated(type: str):
    """DEPRECATED: Sử dụng /categories để lấy tất cả danh mục."""
    raise HTTPException(status_code=400, detail="Vui lòng sử dụng /categories để lấy danh sách đầy đủ. Endpoint /default/{type} đã lỗi thời.")

@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: UUID,
    payload: CategoryCreate,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    category = crud_update_category(db, category_id, current_user.id, payload.dict())
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.delete("/{category_id}")
def delete_category(
    category_id: UUID,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    deleted = crud_delete_category(db, category_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}