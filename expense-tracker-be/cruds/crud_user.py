# crud_user.py
from sqlalchemy.orm import Session
from models import user_model

def get_user_by_firebase_uid(db: Session, firebase_uid: str):
    """Tìm người dùng bằng Firebase UID."""
    return db.query(user_model.User).filter(user_model.User.firebase_uid == firebase_uid).first()

def get_user_by_email(db: Session, email: str):
    """Tìm người dùng bằng Email."""
    return db.query(user_model.User).filter(user_model.User.email == email).first()

def create_user(db: Session, firebase_uid: str = None, email: str = None, name: str = None, profile_image: str = None, password: str = None):
    """Tạo người dùng mới."""
    user = user_model.User(firebase_uid=firebase_uid, email=email, name=name, profile_image=profile_image, password=password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user