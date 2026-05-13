# schemas/audit_schemas.py
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional
from enum import Enum

class AuditAction(str, Enum):
    USER_LOGIN = "USER_LOGIN"
    EXPORT_DATA = "EXPORT_DATA"
    CREATE_EXPENSE = "CREATE_EXPENSE"

class AuditStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"
    DENIED = "denied"


class AuditLogOut(BaseModel):
    id: UUID
    action: str
    actor_email: str
    target: Optional[str] = None
    status: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
