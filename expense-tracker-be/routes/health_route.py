"""Health & readiness endpoints cho deployment (Render/CI/Docker).

- GET /health  → liveness: process còn sống, KHÔNG chạm dependency.
- GET /ready   → readiness: DB là dependency BẮT BUỘC; Redis OPTIONAL/DEGRADED.

An toàn: KHÔNG lộ credential, DATABASE_URL, stack trace hay provider internals.
"""
import logging

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse

from db.database import get_db
from core.cache import check_redis_health

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get("/health")
def health():
    """Liveness probe — chỉ khẳng định tiến trình còn sống."""
    return {"status": "ok"}


@router.get("/ready")
async def ready(db: Session = Depends(get_db)):
    """Readiness probe.

    - database: BẮT BUỘC. Không sẵn sàng → 503.
    - redis: OPTIONAL. Không sẵn sàng → "degraded" nhưng KHÔNG chặn readiness
      (kiến trúc: in-memory fallback ở LOCAL/DEGRADED; prod = Render Key Value).
    """
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        # Không log/nhả chi tiết kết nối ra client; chỉ đánh dấu down.
        logger.warning("Readiness: database check failed")
        db_ok = False

    redis_ok = await check_redis_health()

    ready_state = db_ok  # chỉ DB quyết định readiness
    body = {
        "status": "ready" if ready_state else "not_ready",
        "checks": {
            "database": "ok" if db_ok else "down",
            "redis": "ok" if redis_ok else "degraded",
        },
    }
    return JSONResponse(status_code=200 if ready_state else 503, content=body)
