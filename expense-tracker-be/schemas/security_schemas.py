# schemas/security_schemas.py (TẠO MỚI)
from pydantic import BaseModel
from typing import Optional

class SecuritySettingsOut(BaseModel):
    """Schema trả về cài đặt bảo mật hiện tại của user"""
    is_2fa_enabled: bool
    restrict_multi_device: bool

    class Config:
        from_attributes = True

class SecuritySettingsUpdate(BaseModel):
    """Schema nhận cập nhật cài đặt bảo mật"""
    # Dùng Optional để user có thể cập nhật từng cái một
    is_2fa_enabled: Optional[bool] = None
    restrict_multi_device: Optional[bool] = None

# Schema body nhận mã code
class Verify2FALogin(BaseModel):
    code: str