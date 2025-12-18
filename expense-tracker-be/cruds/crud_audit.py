# cruds/crud_audit.py
import datetime

from sqlalchemy.orm import Session
from models import audit_model
from sqlalchemy import desc

def create_audit_log(
    db: Session,
    action: str,
    actor_email: str,
    target: str = None,
    status: str = "SUCCESS",
    details: str = None,
    ip_address: str = None
):
    log = audit_model.AuditLog(
        action=action,
        actor_email=actor_email,
        target=target,
        status=status,
        details=str(details) if details else None,
        ip_address=ip_address
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

# cruds/crud_audit.py
def log_action(db: Session, actor_email: str, action: str, target: str = None, details: str = None,
               status: str = "INFO", ip_address: str = None):
    try:
        # Kiểm tra xem model có cột status/ip_address không để tránh lỗi
        # (Giả sử model của bạn đã có, nếu chưa có thì nó sẽ bỏ qua hoặc cần migration)

        new_log = audit_model.AuditLog(
            actor_email=actor_email,
            action=action,
            target=target,
            details=details,
            created_at=datetime.datetime.now(),
            status=status,
            ip_address=ip_address
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        return new_log
    except Exception as e:
        print(f"⚠️ Lỗi ghi Audit Log (Không ảnh hưởng luồng chính): {str(e)}")
        db.rollback()
        return None  # Trả về None chứ không throw lỗi 500


def get_audit_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(audit_model.AuditLog).order_by(audit_model.AuditLog.created_at.desc()).offset(skip).limit(limit).all()