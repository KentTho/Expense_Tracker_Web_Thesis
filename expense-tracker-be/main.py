from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from db.database import SessionLocal, engine, Base
import crud
from schema import (
    UserOut, IncomeOut, ExpenseOut,
    ExpenseCreate, IncomeCreate, UserSyncPayload, UserUpdate
)

# ------------------------------
# 🔹 Firebase Admin Initialization
# ------------------------------
import firebase_admin
from firebase_admin import credentials, auth as fb_auth
from firebase_admin_init import auth as fb_auth

# ⚠️ Đảm bảo chỉ khởi tạo 1 lần
if not firebase_admin._apps:
    cred = credentials.Certificate("expense-tracker-2200006616-firebase-adminsdk-fbsvc-a546ca1c4b.json")  # 🔑 Đặt file này cạnh main.py
    firebase_admin.initialize_app(cred)

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
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=400, detail="Invalid Authorization header")
    return authorization.split(" ", 1)[1]

def verify_token_and_get_payload(id_token: str):
    try:
        decoded = fb_auth.verify_id_token(id_token)
        print("✅ Token verified successfully:", decoded)
        return decoded
    except Exception as e:
        import traceback
        print("❌ Token verification failed!")
        print("Lỗi chi tiết:", e)
        traceback.print_exc()
        raise HTTPException(status_code=401, detail=f"Token verification failed: {e}")

# ------------------------------
# 🔹 API Routes
# ------------------------------

# ✅ SYNC USER
# ✅ SYNC USER
@app.post("/auth/sync", response_model=UserOut)
def auth_sync(payload: UserSyncPayload, authorization: str = Header(...), db: Session = Depends(get_db)):
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
            db.add(user); db.commit(); db.refresh(user)
    return user

# ✅ GET ME
@app.get("/me", response_model=UserOut)
def get_me(authorization: str = Header(...), db: Session = Depends(get_db)):
    id_token = extract_token(authorization)
    payload = verify_token_and_get_payload(id_token)
    uid = payload.get("uid")
    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/auth/user/profile", response_model=UserOut)
def get_profile(authorization: str = Header(...), db: Session = Depends(get_db)):
    id_token = extract_token(authorization)
    payload = verify_token_and_get_payload(id_token)
    uid = payload.get("uid")

    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

# app/main.py (trích đoạn)
@app.put("/auth/user/profile", response_model=UserOut)
def update_profile(
    data: UserUpdate,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    print("✅ Route /auth/user/profile được gọi!")
    id_token = extract_token(authorization)
    payload = verify_token_and_get_payload(id_token)
    firebase_uid = payload.get("uid")

    user = crud.get_user_by_firebase_uid(db, firebase_uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 🧰 Cập nhật các field nếu có
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

# ✅ INCOMES
@app.post("/incomes", response_model=IncomeOut)
def create_income(payload: IncomeCreate, authorization: str = Header(...), db: Session = Depends(get_db)):
    id_token = extract_token(authorization)
    token_payload = verify_token_and_get_payload(id_token)
    uid = token_payload.get("uid")
    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        user = crud.create_user(db, firebase_uid=uid, email=token_payload.get("email"))
    return crud.create_income(db, user_id=user.id, **payload.dict())


@app.get("/incomes", response_model=List[IncomeOut])
def list_incomes(authorization: str = Header(...), db: Session = Depends(get_db)):
    id_token = extract_token(authorization)
    payload = verify_token_and_get_payload(id_token)
    uid = payload.get("uid")
    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.list_incomes_for_user(db, user.id)


# ✅ EXPENSES
@app.post("/expenses", response_model=ExpenseOut)
def create_expense(payload: ExpenseCreate, authorization: str = Header(...), db: Session = Depends(get_db)):
    id_token = extract_token(authorization)
    payload_fb = verify_token_and_get_payload(id_token)
    uid = payload_fb.get("uid")
    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        user = crud.create_user(db, firebase_uid=uid, email=payload_fb.get("email"))
    return crud.create_expense(db, user_id=user.id, **payload.dict())


@app.get("/expenses", response_model=List[ExpenseOut])
def list_expenses(authorization: str = Header(...), db: Session = Depends(get_db)):
    id_token = extract_token(authorization)
    payload = verify_token_and_get_payload(id_token)
    uid = payload.get("uid")
    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.list_expenses_for_user(db, user.id)