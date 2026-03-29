# schemas/audit_schemas.py
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import Json
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
    actor_id: Optional[UUID]
    actor_email: str
    target: Optional[str] = "export_id"
    status: str
    details: Optional[Json] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True