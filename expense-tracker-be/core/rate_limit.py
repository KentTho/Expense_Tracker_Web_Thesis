# core/rate_limit.py
"""Rate limiting authority (F3).

Chiến lược storage (theo quyết định Human Operator):
- Ưu tiên Redis (dùng REDIS_URL sẵn có) → bền qua restart, share giữa workers.
- Nếu Redis không kết nối được (dev/thesis/local không chạy Redis) → fallback in-memory.

Limiter được import và gắn vào app trong main.py; decorator @limiter.limit(...) gắn
trên từng endpoint nhạy cảm (login/2FA/chat).
"""
import logging
from typing import Optional

from slowapi import Limiter
from slowapi.util import get_remote_address

from core.config import settings

logger = logging.getLogger(__name__)


def _resolve_storage_uri() -> Optional[str]:
    """Trả về Redis URI nếu ping OK, ngược lại None (slowapi dùng in-memory)."""
    redis_url = (settings.REDIS_URL or "").strip()
    if not redis_url:
        return None
    try:
        import redis  # redis-py đã có trong requirements.txt

        client = redis.from_url(redis_url, socket_connect_timeout=1)
        client.ping()
        client.close()
        logger.info("Rate limit storage: Redis")
        return redis_url
    except Exception as exc:  # noqa: BLE001 — cố ý bắt rộng để fallback an toàn.
        logger.warning(
            "Rate limit: Redis không khả dụng (%s) → fallback in-memory.",
            type(exc).__name__,
        )
        return None


# Ngưỡng mặc định (giây/phút). Auth nhạy brute-force → chặt; chat cost-guard → nới hơn.
AUTH_RATE_LIMIT = "5/minute"
CHAT_RATE_LIMIT = "20/minute"

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=_resolve_storage_uri(),  # None → in-memory
)
