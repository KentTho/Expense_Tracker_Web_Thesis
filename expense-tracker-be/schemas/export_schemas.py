from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel
from uuid import UUID
from schemas.analytics_schemas import AnalyticsFilter


class ExportStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"

class ExportResponse(BaseModel):
    message: str
    file_url: str
    export_id: UUID
    status: ExportStatus = ExportStatus.completed
    filters: Optional[AnalyticsFilter]
    file_size: Optional[str] = None  # VD: "1.2 MB" - Giúp người dùng biết file nặng hay nhẹ
    expiry_time: Optional[datetime] = None  # Nếu dùng Signed URL (link tự hủy sau 15p), cần báo cho FE biết


