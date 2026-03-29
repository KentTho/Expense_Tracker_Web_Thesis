# tasks/export_tasks.py
from celery_app import celery_app
import pandas as pd
from io import BytesIO
from cruds.crud_income import list_incomes_for_user
from cruds.crud_expense import list_expenses_for_user
from db.database import SessionLocal

@celery_app.task
def export_income_task(user_id: str):
    db = SessionLocal()
    data = list_incomes_for_user(db, user_id)["items"]
    df = pd.DataFrame([...])  # giống export_route
    # Upload lên Firebase Storage hoặc gửi email
    # Trả về signed URL
    return {"file_url": "https://storage.../incomes.xlsx", "status": "completed"}