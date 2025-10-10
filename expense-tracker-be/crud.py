# crud.py
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

def create_income(db: Session, user_id: int, source: str, amount: Decimal, date_val: date, emoji: str = None):
    inc = models.Income(user_id=user_id, source=source, amount=amount, date=date_val, emoji=emoji)
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return inc

def list_incomes_for_user(db: Session, user_id: int):
    return db.query(models.Income).filter(models.Income.user_id == user_id).order_by(models.Income.date.desc()).all()

def create_expense(db: Session, user_id: int, category: str, amount: Decimal, date_val: date, emoji: str = None):
    exp = models.Expense(user_id=user_id, category=category, amount=amount, date=date_val, emoji=emoji)
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp

def list_expenses_for_user(db: Session, user_id: int):
    return db.query(models.Expense).filter(models.Expense.user_id == user_id).order_by(models.Expense.date.desc()).all()
