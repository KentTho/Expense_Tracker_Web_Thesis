# schemas/audit_schemas.py
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

class AuditLogOut(BaseModel):
    id: UUID
    action: str
    actor_email: str
    target: Optional[str] = None
    status: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True