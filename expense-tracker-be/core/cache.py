# core/cache.py

import json
import logging
from typing import Optional, Any

import redis.asyncio as redis
from redis.exceptions import RedisError

from core.config import settings

logger = logging.getLogger(__name__)

# =========================================================
# ✅ REDIS CLIENT (Async + Connection Pool)
# =========================================================
redis_client: Optional[redis.Redis] = None


def init_redis():
    """
    Khởi tạo Redis connection (gọi ở startup)
    """
    global redis_client

    try:
        redis_client = redis.from_url(
            settings.REDIS_URL or "redis://localhost:6379/0",
            encoding="utf-8",
            decode_responses=True,
            max_connections=10
        )
        logger.info("✅ Redis initialized")

    except Exception as e:
        logger.error(f"❌ Redis init failed: {e}")
        redis_client = None


async def close_redis():
    """
    Đóng connection (gọi ở shutdown)
    """
    global redis_client

    if redis_client:
        await redis_client.close()
        logger.info("🔌 Redis connection closed")


# =========================================================
# ✅ BASIC CACHE OPERATIONS
# =========================================================
async def get_cached(key: str) -> Optional[Any]:
    """
    Lấy dữ liệu từ Redis (auto parse JSON)
    """
    if not redis_client:
        return None

    try:
        data = await redis_client.get(key)
        return json.loads(data) if data else None

    except (RedisError, json.JSONDecodeError) as e:
        logger.warning(f"⚠️ Redis GET error ({key}): {e}")
        return None


async def set_cached(key: str, value: Any, ex: int = 300) -> bool:
    """
    Lưu cache vào Redis
    """
    if not redis_client:
        return False

    try:
        await redis_client.set(
            key,
            json.dumps(value),
            ex=ex
        )
        return True

    except (RedisError, TypeError) as e:
        logger.warning(f"⚠️ Redis SET error ({key}): {e}")
        return False


async def delete_cached(key: str):
    """
    Xóa cache
    """
    if not redis_client:
        return

    try:
        await redis_client.delete(key)
    except RedisError as e:
        logger.warning(f"⚠️ Redis DELETE error ({key}): {e}")


# =========================================================
# ✅ ADVANCED: USER SUMMARY CACHE (fix từ code 2)
# =========================================================
async def get_user_summary_cache(user_id: int):
    key = f"summary:{user_id}"
    return await get_cached(key)


async def set_user_summary_cache(user_id: int, summary_data, ex: int = 3600):
    key = f"summary:{user_id}"
    return await set_cached(key, summary_data, ex=ex)


# =========================================================
# ✅ HEALTH CHECK
# =========================================================
async def check_redis_health() -> bool:
    if not redis_client:
        return False

    try:
        await redis_client.ping()
        return True
    except RedisError:
        return False