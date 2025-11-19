# models/audit_model.py
import uuid
from sqlalchemy import Column, String, DateTime, func, Text
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action = Column(String(50), nullable=False)      # VD: "DELETE_USER", "UPDATE_SETTINGS"
    actor_email = Column(String(255), nullable=False) # Email người thực hiện (Admin)
    target = Column(String(255), nullable=True)      # Đối tượng bị tác động (VD: email user bị xóa)
    status = Column(String(20), default="SUCCESS")   # "SUCCESS" hoặc "ERROR"
    details = Column(Text, nullable=True)            # Chi tiết lỗi hoặc dữ liệu thay đổi
    ip_address = Column(String(50), nullable=True)   # IP người thực hiện
    created_at = Column(DateTime(timezone=True), server_default=func.now())