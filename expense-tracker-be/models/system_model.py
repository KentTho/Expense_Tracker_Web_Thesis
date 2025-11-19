# models/system_model.py
from sqlalchemy import Column, Integer, Boolean, String, DateTime, func
from db.database import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True) # Luôn là 1
    maintenance_mode = Column(Boolean, default=False)
    allow_signup = Column(Boolean, default=True)
    broadcast_message = Column(String(255), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())