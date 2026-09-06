import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
from dotenv import load_dotenv

# Thêm đường dẫn dự án để Alembic tìm thấy các file model
sys.path.append(os.getcwd())

# Import Database Base và các Models
from db.database import Base
from core.config import settings
import models # Load tất cả các model đã viết

# Load biến môi trường
load_dotenv()

# Alembic Config
config = context.config


def _assert_safe_test_url(url: str) -> None:
    """Guard: khi migrate bằng TEST_DATABASE_URL, chỉ cho phép DB test local.

    Chặn trỏ nhầm vào Neon/Render/production. KHÔNG in giá trị URL.
    """
    from urllib.parse import urlparse

    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    dbname = (parsed.path or "").lstrip("/").lower()
    banned = ("neon", "render", "railway", "supabase", "production", "prod", "amazonaws")
    if any(token in host or token in dbname for token in banned):
        raise RuntimeError("TEST_DATABASE_URL bị từ chối: có dấu hiệu DB remote/production.")
    if host not in ("localhost", "127.0.0.1", "::1"):
        raise RuntimeError("TEST_DATABASE_URL phải trỏ host local.")
    if "test" not in dbname:
        raise RuntimeError("TEST_DATABASE_URL phải là database có 'test' trong tên.")


def _resolve_db_url() -> str:
    """Ưu tiên TEST_DATABASE_URL (có guard) rồi mới tới DATABASE_URL production."""
    test_url = os.getenv("TEST_DATABASE_URL")
    if test_url:
        _assert_safe_test_url(test_url)
        return test_url
    return settings.DATABASE_URL


# Ghi đè sqlalchemy.url: TEST_DATABASE_URL (local test) > DATABASE_URL (.env)
config.set_main_option("sqlalchemy.url", _resolve_db_url())

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 🚀 QUAN TRỌNG: Đây là nơi Alembic so sánh DB thực tế với Code
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "pyformat"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
