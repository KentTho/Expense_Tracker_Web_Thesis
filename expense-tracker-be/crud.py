# crud.py
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session
import models
from datetime import date
from decimal import Decimal

def get_user_by_firebase_uid(db: Session, firebase_uid: str):
    return db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, firebase_uid: str = None, email: str = None, name: str = None, profile_image: str = None, password: str = None):
    user = models.User(firebase_uid=firebase_uid, email=email, name=name, profile_image=profile_image, password=password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# ---- INCOME ----
def update_income(db: Session, income_id: UUID, user_id: UUID, update_data: dict):
    income = (
        db.query(models.Income)
        .filter(models.Income.id == income_id, models.Income.user_id == user_id)
        .first()
    )
    if not income:
        return None
    for key, value in update_data.items():
        setattr(income, key, value)
    db.commit()
    db.refresh(income)
    return income


def delete_income(db: Session, income_id: UUID, user_id: UUID):
    income = (
        db.query(models.Income)
        .filter(models.Income.id == income_id, models.Income.user_id == user_id)
        .first()
    )
    if not income:
        return None
    db.delete(income)
    db.commit()
    return income


def get_income_summary(db: Session, user_id: UUID):
    total = (
        db.query(func.sum(models.Income.amount))
        .filter(models.Income.user_id == user_id)
        .scalar()
        or 0
    )
    return float(total)


def create_income(db: Session, user_id: int, source: str, amount: Decimal, date_val: date, emoji: str = None):
    inc = models.Income(user_id=user_id, source=source, amount=amount, date=date_val, emoji=emoji)
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return inc

def list_incomes_for_user(db: Session, user_id: int):
    return db.query(models.Income).filter(models.Income.user_id == user_id).order_by(models.Income.date.desc()).all()




# ---- EXPENSE ----
def update_expense(db: Session, expense_id: UUID, user_id: UUID, update_data: dict):
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.user_id == user_id)
        .first()
    )
    if not expense:
        return None
    for key, value in update_data.items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense_id: UUID, user_id: UUID):
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.user_id == user_id)
        .first()
    )
    if not expense:
        return None
    db.delete(expense)
    db.commit()
    return expense


def get_expense_summary(db: Session, user_id: UUID):
    total = (
        db.query(func.sum(models.Expense.amount))
        .filter(models.Expense.user_id == user_id)
        .scalar()
        or 0
    )
    return float(total)


def create_expense(db: Session, user_id: int, category: str, amount: Decimal, date_val: date, emoji: str = None):
    exp = models.Expense(user_id=user_id, category=category, amount=amount, date=date_val, emoji=emoji)
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp

def list_expenses_for_user(db: Session, user_id: int):
    return db.query(models.Expense).filter(models.Expense.user_id == user_id).order_by(models.Expense.date.desc()).all()
