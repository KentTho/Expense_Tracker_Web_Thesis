# cruds/crud_system.py
from sqlalchemy.orm import Session
from models import system_model
from schemas import system_schemas


def get_system_settings(db: Session):
    """Lấy cài đặt hệ thống. Nếu chưa có, tự động tạo mặc định."""
    settings = db.query(system_model.SystemSetting).filter(system_model.SystemSetting.id == 1).first()
    if not settings:
        # Khởi tạo dòng đầu tiên nếu chưa có
        settings = system_model.SystemSetting(
            id=1,
            maintenance_mode=False,
            allow_signup=True,
            broadcast_message=""
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def update_system_settings(db: Session, update_data: system_schemas.SystemSettingsUpdate):
    """Cập nhật cài đặt"""
    settings = get_system_settings(db)  # Lấy setting hiện tại (hoặc tạo mới)

    settings.maintenance_mode = update_data.maintenance_mode
    settings.allow_signup = update_data.allow_signup
    settings.broadcast_message = update_data.broadcast_message

    db.commit()
    db.refresh(settings)
    return settings