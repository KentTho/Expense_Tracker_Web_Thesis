# schemas/system_schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SystemSettingsBase(BaseModel):
    maintenance_mode: bool
    allow_signup: bool
    broadcast_message: Optional[str] = None

class SystemSettingsUpdate(SystemSettingsBase):
    pass

class SystemSettingsOut(SystemSettingsBase):
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True