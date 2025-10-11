from datetime import date
from io import BytesIO
from typing import List
from datetime import date

import firebase_admin
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
import pandas as pd

# ------------------------------
# 🔹 Internal imports
# ------------------------------
import models
from db.database import SessionLocal, engine, Base
import crud
from schema import (
    UserOut, IncomeOut, ExpenseOut,
    ExpenseCreate, IncomeCreate, UserSyncPayload, UserUpdate
)

# ------------------------------
# 🔹 Firebase Initialization
# ------------------------------
# ------------------------------
# 🔹 Firebase Initialization (safe)
# ------------------------------
import os, json
from dotenv import load_dotenv
from firebase_admin import credentials, auth as fb_auth

# 🔹 Load biến môi trường
load_dotenv()

# 🔹 Đọc key từ .env
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
        raise RuntimeError("FIREBASE_CREDENTIALS not found in .env")

# ------------------------------
# 🔹 FastAPI App Setup
# ------------------------------
app = FastAPI(title="Expense Tracker API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------
# 🔹 Database Dependency
# ------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ------------------------------
# 🔹 Helper Functions
# ------------------------------
def extract_token(authorization: str) -> str:
    """Lấy token từ header Bearer."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=400, detail="Invalid Authorization header")
    return authorization.split(" ", 1)[1]

def verify_token_and_get_payload(id_token: str):
    """Xác minh Firebase ID token."""
    try:
        decoded = fb_auth.verify_id_token(id_token)
        print("✅ Token verified successfully:", decoded)
        return decoded
    except Exception as e:
        import traceback
        print("❌ Token verification failed!", e)
        traceback.print_exc()
        raise HTTPException(status_code=401, detail=f"Token verification failed: {e}")

# ======================================================
# 🧩 AUTHENTICATION & USER ROUTES
# ======================================================

@app.post("/auth/sync", response_model=UserOut)
def auth_sync(payload: UserSyncPayload, authorization: str = Header(...), db: Session = Depends(get_db)):
    """Đồng bộ user giữa Firebase và DB."""
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
def get_profile(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Lấy thông tin hồ sơ người dùng."""
    id_token = extract_token(authorization)
    payload = verify_token_and_get_payload(id_token)
    uid = payload.get("uid")

    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/auth/user/profile", response_model=UserOut)
def update_profile(
    data: UserUpdate,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """Cập nhật hồ sơ người dùng."""
    print("✅ Route /auth/user/profile được gọi!")
    id_token = extract_token(authorization)
    payload = verify_token_and_get_payload(id_token)
    firebase_uid = payload.get("uid")

    user = crud.get_user_by_firebase_uid(db, firebase_uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Cập nhật thông tin
    if data.name:
        user.name = data.name
    if data.email:
        user.email = data.email
    if data.profile_image:
        user.profile_image = data.profile_image
    if data.gender:
        user.gender = data.gender
    if data.birthday:
        user.birthday = data.birthday

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.get("/me", response_model=UserOut)
def get_me(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Trả về thông tin người dùng hiện tại."""
    id_token = extract_token(authorization)
    payload = verify_token_and_get_payload(id_token)
    uid = payload.get("uid")
    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ======================================================
# 💰 INCOME ROUTES
# ======================================================

@app.post("/incomes", response_model=IncomeOut)
def create_income(payload: IncomeCreate, authorization: str = Header(...), db: Session = Depends(get_db)):
    """Thêm thu nhập mới."""
    id_token = extract_token(authorization)
    token_payload = verify_token_and_get_payload(id_token)
    uid = token_payload.get("uid")
    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        user = crud.create_user(db, firebase_uid=uid, email=token_payload.get("email"))
    return crud.create_income(db, user_id=user.id, **payload.dict())


@app.get("/incomes", response_model=List[IncomeOut])
def list_incomes(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Danh sách thu nhập."""
    id_token = extract_token(authorization)
    payload = verify_token_and_get_payload(id_token)
    uid = payload.get("uid")
    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.list_incomes_for_user(db, user.id)

# ======================================================
# 💸 EXPENSE ROUTES
# ======================================================

@app.post("/expenses", response_model=ExpenseOut)
def create_expense(payload: ExpenseCreate, authorization: str = Header(...), db: Session = Depends(get_db)):
    """Thêm chi tiêu mới."""
    id_token = extract_token(authorization)
    payload_fb = verify_token_and_get_payload(id_token)
    uid = payload_fb.get("uid")
    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        user = crud.create_user(db, firebase_uid=uid, email=payload_fb.get("email"))
    return crud.create_expense(db, user_id=user.id, **payload.dict())


@app.get("/expenses", response_model=List[ExpenseOut])
def list_expenses(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Danh sách chi tiêu."""
    id_token = extract_token(authorization)
    payload = verify_token_and_get_payload(id_token)
    uid = payload.get("uid")
    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.list_expenses_for_user(db, user.id)

# ======================================================
# 📊 DASHBOARD & ANALYTICS
# ======================================================

@app.get("/dashboard/summary")
def get_dashboard_summary(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Tổng quan thu chi."""
    token = extract_token(authorization)
    payload = verify_token_and_get_payload(token)
    uid = payload.get("uid")

    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    total_income = crud.get_income_summary(db, user.id)
    total_expense = crud.get_expense_summary(db, user.id)
    total_balance = total_income - total_expense

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "total_balance": total_balance,
    }


@app.get("/analytics/trends")
def get_analytics_trends(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Xu hướng thu chi theo ngày."""
    token = extract_token(authorization)
    payload = verify_token_and_get_payload(token)
    uid = payload.get("uid")
    user = crud.get_user_by_firebase_uid(db, uid)

    income_data = (
        db.query(models.Income.date, func.sum(models.Income.amount))
        .filter(models.Income.user_id == user.id)
        .group_by(models.Income.date)
        .order_by(models.Income.date)
        .limit(60)
        .all()
    )
    expense_data = (
        db.query(models.Expense.date, func.sum(models.Expense.amount))
        .filter(models.Expense.user_id == user.id)
        .group_by(models.Expense.date)
        .order_by(models.Expense.date)
        .limit(30)
        .all()
    )

    return {
        "income_trend": [{"date": str(d), "amount": float(a)} for d, a in income_data],
        "expense_trend": [{"date": str(d), "amount": float(a)} for d, a in expense_data],
    }

# ======================================================
# 📤 EXPORT ROUTES (Excel)
# ======================================================

@app.get("/export/income")
def export_income(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Xuất file Excel cho Income."""
    token = extract_token(authorization)
    payload = verify_token_and_get_payload(token)
    uid = payload.get("uid")
    user = crud.get_user_by_firebase_uid(db, uid)

    incomes = crud.list_incomes_for_user(db, user.id)
    df = pd.DataFrame([
        {"ID": str(i.id), "Source": i.source, "Amount": float(i.amount), "Date": i.date.isoformat(), "Emoji": i.emoji}
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
def export_expense(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Xuất file Excel cho Expense."""
    token = extract_token(authorization)
    payload = verify_token_and_get_payload(token)
    uid = payload.get("uid")
    user = crud.get_user_by_firebase_uid(db, uid)

    expenses = crud.list_expenses_for_user(db, user.id)
    df = pd.DataFrame([
        {"ID": str(e.id), "Category": e.category, "Amount": float(e.amount), "Date": e.date.isoformat(), "Emoji": e.emoji}
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
