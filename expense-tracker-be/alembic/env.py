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
from db.migration_url import resolve_migration_url
from core.config import settings
import models # Load tất cả các model đã viết

# Load biến môi trường
load_dotenv()

# Alembic Config
config = context.config


# Ghi đè sqlalchemy.url theo precedence (xem db/migration_url.py):
#   TEST_DATABASE_URL (guard local) > DATABASE_MIGRATION_URL (direct) > DATABASE_URL (runtime).
config.set_main_option(
    "sqlalchemy.url", resolve_migration_url(runtime_url=settings.DATABASE_URL)
)

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
