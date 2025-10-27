# main.py
import os
import json
from io import BytesIO
from datetime import date
from typing import List, Optional
from uuid import UUID

import pandas as pd
import firebase_admin
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from firebase_admin import credentials, auth as fb_auth
from sqlalchemy import func

# internal imports (the files you already have)
import models
from db.database import SessionLocal, engine  # assumes database.py exposes SessionLocal and engine
import crud
from schemas import (  # your file is named schema.py per your last message
    UserOut, IncomeOut, ExpenseOut,
    ExpenseCreate, IncomeCreate, UserSyncPayload, UserUpdate,
    CategoryOut, CategoryCreate, TransactionOut, SummaryOut,
    DashboardResponse, DefaultCategoryOut
)

# create tables if not handled elsewhere (optional)
models.Base.metadata.create_all(bind=engine)

# -------------------------------------------------
# Firebase initialization (from .env FIREBASE_SERVICE_ACCOUNT JSON)
# -------------------------------------------------
load_dotenv()
firebase_key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")
if not firebase_admin._apps:
    if firebase_key_json:
        try:
            firebase_dict = json.loads(firebase_key_json)
            cred = credentials.Certificate(firebase_dict)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized from .env successfully")
        except Exception as e:
            print("❌ Error loading Firebase credentials from .env:", e)
    else:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT not found in .env")

# -------------------------------------------------
# FastAPI app + CORS
# -------------------------------------------------
app = FastAPI(title="Expense Tracker API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # add your deployed frontend origins if any
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# DB dependency
# -------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------
# Auth helpers
# -------------------------------------------------
# ----------------------
# Extract Token
# ----------------------
def extract_token(authorization: str) -> str:
    """Lấy token từ header Bearer."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=400, detail="Invalid Authorization header format")
    token = authorization.split(" ", 1)[1]
    # Debug (chỉ bật khi cần)
    # print("🔑 Extracted Token:", token[:20], "...")
    return token


# ----------------------
# Verify Token with Firebase
# ----------------------
def verify_token_and_get_payload(id_token: str):
    """Xác minh Firebase ID token và trả payload."""
    try:
        decoded = fb_auth.verify_id_token(id_token)
        # print("✅ Firebase token verified for UID:", decoded.get("uid"))
        return decoded
    except fb_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except fb_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")
    except fb_auth.RevokedIdTokenError:
        raise HTTPException(status_code=401, detail="Token has been revoked")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


# ----------------------
# Dependency: get current user
# ----------------------
def get_current_user_db(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """
    Dependency: Verify Firebase token, ensure user exists in DB,
    and return the DB user object.
    """
    id_token = extract_token(authorization)
    payload = verify_token_and_get_payload(id_token)

    uid = payload.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token payload: uid missing")

    # Tìm user theo firebase_uid
    user = crud.get_user_by_firebase_uid(db, uid)

    # Nếu chưa tồn tại -> tự động tạo user
    if not user:
        email = payload.get("email") or f"user_{uid}@noemail.local"
        name = payload.get("name") or payload.get("displayName") or "Unnamed User"
        picture = payload.get("picture")
        user = crud.create_user(
            db,
            firebase_uid=uid,
            email=email,
            name=name,
            profile_image=picture
        )
        # print(f"🆕 User created automatically for UID: {uid}")

    return user
# ----------------------
# USER ROUTES
# ----------------------
@app.post("/auth/sync", response_model=UserOut)
def auth_sync(payload: UserSyncPayload, authorization: str = Header(...), db: Session = Depends(get_db)):
    """
    Đồng bộ user giữa Firebase và DB (explicit sync route).
    FE should send Authorization: Bearer <idToken> and payload (email, firebase_uid, display_name)
    """
    id_token = extract_token(authorization)
    decoded = verify_token_and_get_payload(id_token)

    uid = decoded.get("uid")
    email = decoded.get("email") or payload.email
    name = payload.display_name or decoded.get("name")
    picture = decoded.get("picture")

    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        user = crud.create_user(db, firebase_uid=uid, email=email, name=name, profile_image=picture)
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

@app.get("/auth/user/profile", response_model=UserOut)
def get_profile(current_user = Depends(get_current_user_db)):
    """Lấy thông tin hồ sơ người dùng."""
    return current_user

@app.put("/auth/user/profile", response_model=UserOut)
def update_profile(data: UserUpdate, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    """Cập nhật hồ sơ người dùng."""
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

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.get("/me", response_model=UserOut)
def get_me(current_user = Depends(get_current_user_db)):
    """Trả về thông tin người dùng hiện tại."""
    return current_user

# ----------------------
# INCOME ROUTES
# ----------------------
@app.post("/incomes", response_model=IncomeOut)
def create_income(payload: IncomeCreate, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    """
    Thêm thu nhập mới.
    """
    income = crud.create_income(
        db=db,
        user_id=current_user.id,
        category_name=payload.category_name,
        amount=payload.amount,
        date_val=payload.date,
        emoji=payload.emoji,
        category_id=payload.category_id,
    )
    return income

@app.get("/incomes", response_model=List[IncomeOut])
def list_incomes(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    incomes = crud.list_incomes_for_user(db, current_user.id)
    return incomes

@app.put("/incomes/{income_id}", response_model=IncomeOut)
def update_income(income_id: UUID, update_data: dict, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    updated_income = crud.update_income(db, income_id, current_user.id, update_data)
    if not updated_income:
        raise HTTPException(status_code=404, detail="Income not found")
    return updated_income

@app.delete("/incomes/{income_id}")
def delete_income(income_id: UUID, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    deleted = crud.delete_income(db, income_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Income not found")
    return {"message": "Income deleted successfully"}

# ----------------------
# EXPENSE ROUTES
# ----------------------
@app.post("/expenses", response_model=ExpenseOut)
def create_expense(payload: ExpenseCreate, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    expense = crud.create_expense(
        db=db,
        user_id=current_user.id,
        amount=payload.amount,
        date_val=payload.date,
        emoji=payload.emoji,
        category_id=payload.category_id,
        category_name=payload.category_name or None,
    )
    return expense

@app.get("/expenses", response_model=List[ExpenseOut])
def list_expenses(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    expenses = crud.list_expenses_for_user(db, current_user.id)
    return expenses

@app.put("/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(expense_id: UUID, update_data: dict, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    updated_expense = crud.update_expense(db, expense_id, current_user.id, update_data)
    if not updated_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated_expense

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: UUID, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    deleted = crud.delete_expense(db, expense_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}
# ----------------------
# CATEGORY ROUTES
# ----------------------
@app.post("/categories")
def create_category(
    payload: dict,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    category = crud.create_category(
        db=db,
        user_id=current_user.id,
        name=payload.get("name"),
        type=payload.get("type"),
        icon=payload.get("icon"),
        color=payload.get("color"),
    )

    return {
        "message": "Category created successfully",
        "category": {
            "id": category.id,
            "name": category.name,
            "type": category.type,
            "icon": category.icon,
            "color": category.color,
        },
    }


@app.get("/categories", response_model=List[CategoryOut | DefaultCategoryOut])
def list_categories(
    type: Optional[str] = None,
    include_default: bool = True,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    # Lấy danh mục người dùng
    user_categories = crud.list_categories_for_user(db, current_user.id, type_filter=type)

    # Lấy danh mục mặc định
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

    # Gộp và trả kết quả
    return default_categories + user_categories

@app.put("/categories/{category_id}", response_model=CategoryOut)
def update_category(category_id: UUID, payload: CategoryCreate, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    category = crud.update_category(db, category_id, current_user.id, payload.dict())
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.delete("/categories/{category_id}")
def delete_category(category_id: UUID, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    deleted = crud.delete_category(db, category_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# ----------------------
# TRANSACTIONS (Read-only, T3)
# ----------------------
@app.get("/transactions", response_model=List[TransactionOut])
def list_transactions(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    """Lấy tất cả giao dịch (thu + chi). Read-only per decision T3."""
    transactions = crud.list_transactions_for_user(db, current_user.id)
    return transactions

@app.get("/transactions/summary", response_model=SummaryOut)
def get_summary(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    summary = crud.get_financial_summary(db, current_user.id)
    # crud.get_financial_summary already returns dict with floats
    return {"total_income": summary["total_income"], "total_expense": summary["total_expense"], "balance": summary["balance"]}

@app.get("/transactions/category-summary", response_model=List[dict])
def get_expense_by_category(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    return crud.get_expense_by_category(db, current_user.id)

# ----------------------
# DASHBOARD & ANALYTICS
# ----------------------
@app.get("/dashboard/summary", response_model=SummaryOut)
def get_dashboard_summary(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    total_income = float(crud.get_income_summary(db, current_user.id) or 0)
    total_expense = float(crud.get_expense_summary(db, current_user.id) or 0)
    total_balance = total_income - total_expense
    return {"total_income": total_income, "total_expense": total_expense, "balance": total_balance}

@app.get("/dashboard/data", response_model=DashboardResponse)
def get_dashboard_data(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    data = crud.get_dashboard_data(db, current_user.id)
    # crud.get_dashboard_data returns summary, recent_transactions (list of dicts), income_chart, expense_chart
    return data

@app.get("/analytics/trends")
def get_analytics_trends(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    income_data = (
        db.query(models.Income.date, func.sum(models.Income.amount))
        .filter(models.Income.user_id == current_user.id)
        .group_by(models.Income.date)
        .order_by(models.Income.date)
        .limit(60)
        .all()
    )
    expense_data = (
        db.query(models.Expense.date, func.sum(models.Expense.amount))
        .filter(models.Expense.user_id == current_user.id)
        .group_by(models.Expense.date)
        .order_by(models.Expense.date)
        .limit(60)
        .all()
    )

    return {
        "income_trend": [{"date": str(d), "amount": float(a)} for d, a in income_data],
        "expense_trend": [{"date": str(d), "amount": float(a)} for d, a in expense_data],
    }

# ----------------------
# EXPORT (Excel)
# ----------------------
@app.get("/export/income")
def export_income(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    incomes = crud.list_incomes_for_user(db, current_user.id)
    df = pd.DataFrame([
        {"ID": str(i.id), "Category": i.category_name, "Amount": float(i.amount), "Date": i.date.isoformat(), "Emoji": i.emoji}
        for i in incomes
    ])
    df.loc[len(df)] = ["", "TOTAL", df["Amount"].sum(), "", ""]
    stream = BytesIO()
    df.to_excel(stream, index=False)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=incomes.xlsx"}
    )

@app.get("/export/expense")
def export_expense(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    expenses = crud.list_expenses_for_user(db, current_user.id)
    df = pd.DataFrame([
        {"ID": str(e.id), "Category": e.category_name, "Amount": float(e.amount), "Date": e.date.isoformat(), "Emoji": e.emoji}
        for e in expenses
    ])
    df.loc[len(df)] = ["", "TOTAL", df["Amount"].sum(), "", ""]
    stream = BytesIO()
    df.to_excel(stream, index=False)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=expenses.xlsx"}
    )

# ----------------------
# DEFAULT CATEGORIES (static)
# ----------------------


# -------------------------------------------------
# Root
# -------------------------------------------------
@app.get("/")
def root():
    return {"message": "Expense Tracker API is running"}

