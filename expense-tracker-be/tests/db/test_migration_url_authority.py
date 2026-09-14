"""Gate 04A1 — migration URL selection authority (offline, KHÔNG cần Postgres).

Chứng minh precedence TEST_DATABASE_URL > DATABASE_MIGRATION_URL > DATABASE_URL và
NO_TARGET_GUARD cho TEST_DATABASE_URL. Dùng getenv giả lập (dict) — KHÔNG đụng env
thật, KHÔNG in/leak URL production.
"""
import pytest

from db.migration_url import assert_safe_test_url, resolve_migration_url


def _env(mapping):
    return lambda key, default=None: mapping.get(key, default)


def test_precedence_test_url_wins():
    env = _env({"TEST_DATABASE_URL": "postgresql://u:p@localhost:5432/expense_tracker_test"})
    assert resolve_migration_url(getenv=env, runtime_url="postgresql://runtime/pooled") == (
        "postgresql://u:p@localhost:5432/expense_tracker_test"
    )


def test_precedence_migration_url_over_runtime():
    env = _env(
        {
            "DATABASE_MIGRATION_URL": "postgresql://direct-host/db",
            "DATABASE_URL": "postgresql://pooled-host/db",
        }
    )
    assert resolve_migration_url(getenv=env, runtime_url="postgresql://pooled-host/db") == (
        "postgresql://direct-host/db"
    )


def test_fallback_to_runtime_when_only_database_url():
    env = _env({})
    assert resolve_migration_url(getenv=env, runtime_url="postgresql://pooled-host/db") == (
        "postgresql://pooled-host/db"
    )


def test_missing_all_raises():
    with pytest.raises(RuntimeError):
        resolve_migration_url(getenv=_env({}), runtime_url=None)


def test_guard_rejects_remote_test_url():
    # host có 'neon' -> bị chặn dù có 'test' trong tên db.
    env = _env({"TEST_DATABASE_URL": "postgresql://u:p@ep-x.neon.tech:5432/testdb"})
    with pytest.raises(RuntimeError):
        resolve_migration_url(getenv=env)


def test_guard_rejects_nonlocal_host():
    with pytest.raises(RuntimeError):
        assert_safe_test_url("postgresql://u:p@10.0.0.5:5432/testdb")


def test_guard_requires_test_in_dbname():
    with pytest.raises(RuntimeError):
        assert_safe_test_url("postgresql://u:p@localhost:5432/prod_like_db")


def test_guard_accepts_valid_local_test_url():
    # Không raise.
    assert_safe_test_url("postgresql://u:p@localhost:5432/expense_tracker_test")
