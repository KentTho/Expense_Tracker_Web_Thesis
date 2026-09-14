"""Migration DB URL selection authority (tách khỏi alembic/env.py để test được).

Precedence (một concern → một authority):
  1. TEST_DATABASE_URL       — chỉ local/CI test, đi qua NO_TARGET_GUARD.
  2. DATABASE_MIGRATION_URL  — kết nối migration canonical (direct / non-pooled).
  3. DATABASE_URL (runtime)  — fallback khi chưa cấu hình URL migration riêng.

Lý do tồn tại (Wave 04A1): trên Neon, chạy DDL migration qua endpoint POOLED
(pgbouncer transaction mode) có thể lỗi/không ổn định. Migration nên dùng kết nối
DIRECT (DATABASE_MIGRATION_URL). Runtime app vẫn dùng DATABASE_URL (pooled).

KHÔNG in/log giá trị URL (chứa credential).
"""
import os

_BANNED_TEST_TOKENS = (
    "neon",
    "render",
    "railway",
    "supabase",
    "production",
    "prod",
    "amazonaws",
)


def assert_safe_test_url(url: str) -> None:
    """Guard: khi migrate bằng TEST_DATABASE_URL, chỉ cho phép DB test local.

    Chặn trỏ nhầm vào Neon/Render/production. KHÔNG in giá trị URL.
    """
    from urllib.parse import urlparse

    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    dbname = (parsed.path or "").lstrip("/").lower()
    if any(token in host or token in dbname for token in _BANNED_TEST_TOKENS):
        raise RuntimeError("TEST_DATABASE_URL bị từ chối: có dấu hiệu DB remote/production.")
    if host not in ("localhost", "127.0.0.1", "::1"):
        raise RuntimeError("TEST_DATABASE_URL phải trỏ host local.")
    if "test" not in dbname:
        raise RuntimeError("TEST_DATABASE_URL phải là database có 'test' trong tên.")


def resolve_migration_url(getenv=os.getenv, runtime_url: str | None = None) -> str:
    """Chọn URL cho Alembic theo precedence ở trên. Trả về URL, KHÔNG in ra."""
    test_url = getenv("TEST_DATABASE_URL")
    if test_url:
        assert_safe_test_url(test_url)
        return test_url

    migration_url = getenv("DATABASE_MIGRATION_URL")
    if migration_url:
        return migration_url

    if runtime_url:
        return runtime_url

    raise RuntimeError(
        "Thiếu URL migration: cần TEST_DATABASE_URL, DATABASE_MIGRATION_URL hoặc DATABASE_URL."
    )
