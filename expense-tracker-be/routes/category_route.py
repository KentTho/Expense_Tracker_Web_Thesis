# routes/category_route.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID, uuid4
import crud
from db.database import get_db
from schemas import CategoryCreate, CategoryOut, DefaultCategoryOut
from services.auth_token_db import get_current_user_db
router = APIRouter(prefix="/categories", tags=["Category"])

@router.post("/", response_model=CategoryOut)
def create_category(
    payload: CategoryCreate,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    category = crud.create_category(
        db=db,
        user_id=current_user.id,
        name=payload.name,
        type=payload.type,
        icon=payload.icon,
        color=payload.color,
    )
    return category


@router.get("/", response_model=List[CategoryOut | DefaultCategoryOut])
def list_categories(
    type: Optional[str] = None,
    include_default: bool = True,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    user_categories = crud.list_categories_for_user(db, current_user.id, type_filter=type)
    default_categories = []
    if include_default:
        default_data = crud.get_default_categories(type or "expense")
        default_categories = [
            DefaultCategoryOut(
                name=item["name"],
                type=type or "expense",
                icon=item["icon_name"],
                color=item["color_code"]
            )
            for item in default_data
        ]
    return default_categories + user_categories


@router.get("/default/{type}", response_model=List[DefaultCategoryOut])
def get_default_categories(type: str, db: Session = Depends(get_db)):
    """Lấy danh mục mặc định (income/expense)."""
    default_data = crud.get_default_categories(type)
    if not default_data:
        raise HTTPException(status_code=404, detail="Không có danh mục mặc định nào.")
    return [
        DefaultCategoryOut(

            name=item["name"],
            type=type,
            icon=item["icon_name"],
            color=item["color_code"]
        )
        for item in default_data
    ]


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: UUID,
    payload: CategoryCreate,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    category = crud.update_category(db, category_id, current_user.id, payload.dict())
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.delete("/{category_id}")
def delete_category(
    category_id: UUID,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    deleted = crud.delete_category(db, category_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}
