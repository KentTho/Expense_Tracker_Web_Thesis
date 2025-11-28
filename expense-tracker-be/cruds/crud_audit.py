# cruds/crud_audit.py
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

def get_audit_logs(db: Session, skip: int = 0, limit: int = 50):
    # Sắp xếp mới nhất lên đầu
    return db.query(audit_model.AuditLog).order_by(desc(audit_model.AuditLog.created_at)).offset(skip).limit(limit).all()