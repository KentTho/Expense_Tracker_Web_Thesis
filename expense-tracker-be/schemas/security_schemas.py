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
    # Dùng Optional để user có thể cập nhật từng cài một
    is_2fa_enabled: Optional[bool] = None
    restrict_multi_device: Optional[bool] = None


class Verify2FALogin(BaseModel):
    # Legacy (đang dùng trong enable flow hiện tại)
    code: str


class Verify2FALoginPending(BaseModel):
    pending_token: str
    code: str

