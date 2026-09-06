"""Pytest shared fixtures — Wave 02B hermetic DB test infrastructure.

NGUYÊN TẮC:
- KHÔNG đọc/in secret. KHÔNG kết nối Neon/production.
- DB test authority = biến môi trường ``TEST_DATABASE_URL`` (Postgres local, tên chứa
  'test'). Nếu KHÔNG có -> các fixture DB tự ``skip`` (SEC tests offline vẫn chạy vì
  chúng mock ``get_db``).
- Cô lập từng test bằng transaction + SAVEPOINT rollback (không xoá dữ liệu thật của ai).

Set ENV mặc định TRƯỚC khi import app để tránh side-effect (sys.exit khi thiếu ENV,
kết nối sai DB). ``setdefault`` để không đè giá trị operator đã cấp.
"""
import os

import pytest

# tests/conftest.py -> lên 1 cấp là thư mục backend.
BE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_TEST_DB_URL = os.getenv("TEST_DATABASE_URL")

# App import cần SECRET_KEY + DATABASE_URL (fail-closed F1/F2). Trỏ toàn bộ process
# vào DB test nếu có, ngược lại dùng placeholder hermetic (fixture DB sẽ skip).
os.environ.setdefault("SECRET_KEY", "test-secret-key")
if _TEST_DB_URL:
    os.environ.setdefault("DATABASE_URL", _TEST_DB_URL)
else:
    os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/testdb")


def _require_test_db():
    if not _TEST_DB_URL:
        pytest.skip("TEST_DATABASE_URL chưa được cấu hình — bỏ qua test cần Postgres thật.")


# ---------------------------------------------------------------------------
# Schema authority: dựng schema 1 lần/phiên bằng chính Alembic (rebuild-from-zero).
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def alembic_config():
    _require_test_db()
    from alembic.config import Config

    cfg = Config(os.path.join(BE_DIR, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(BE_DIR, "alembic"))
    return cfg


@pytest.fixture(scope="session")
def engine(alembic_config):
    """Engine test + schema dựng sạch từ zero qua Alembic (downgrade base -> upgrade head)."""
    from alembic import command
    from sqlalchemy import create_engine

    eng = create_engine(_TEST_DB_URL, future=True)
    # Rebuild-from-zero: đảm bảo schema đúng head, không phụ thuộc trạng thái trước.
    command.downgrade(alembic_config, "base")
    command.upgrade(alembic_config, "head")
    yield eng
    eng.dispose()


@pytest.fixture()
def db_session(engine):
    """Session cô lập: mỗi test chạy trong transaction bao ngoài rồi rollback.

    Dùng SAVEPOINT tái tạo để crud gọi ``db.commit()`` vẫn hoạt động mà không
    persist ra ngoài test (isolation tuyệt đối)."""
    from sqlalchemy import event
    from sqlalchemy.orm import sessionmaker

    connection = engine.connect()
    outer = connection.begin()
    SessionLocal = sessionmaker(bind=connection, expire_on_commit=False, future=True)
    session = SessionLocal()
    session.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(sess, trans):
        if trans.nested and not trans._parent.nested:
            sess.begin_nested()

    try:
        yield session
    finally:
        event.remove(session, "after_transaction_end", _restart_savepoint)
        session.close()
        outer.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    """TestClient trỏ get_db vào db_session cô lập; KHÔNG chạy lifespan (không seed DB thật)."""
    from fastapi.testclient import TestClient

    import main
    from db.database import get_db

    def _override_get_db():
        yield db_session

    main.app.dependency_overrides[get_db] = _override_get_db
    test_client = TestClient(main.app, raise_server_exceptions=False)
    try:
        yield test_client
    finally:
        main.app.dependency_overrides.clear()


@pytest.fixture()
def auth_client(client, db_session, seed_user):
    """TestClient đã override get_current_user_db -> seed_user (bỏ qua JWT/Firebase)."""
    import main
    from services.auth_token_db import get_current_user_db

    main.app.dependency_overrides[get_current_user_db] = lambda: seed_user
    yield client
    # dependency_overrides được client fixture clear ở teardown.


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------
@pytest.fixture()
def seed_user(db_session):
    """Tạo 1 user test tối thiểu, hợp lệ với NOT NULL constraints."""
    import uuid
    from models import user_model

    user = user_model.User(
        id=uuid.uuid4(),
        email=f"user_{uuid.uuid4().hex[:8]}@test.local",
        name="Test User",
        currency_code="USD",
        currency_symbol="$",
        is_2fa_enabled=False,
        restrict_multi_device=False,
        is_admin=False,
        monthly_budget=1000,
        has_onboard=True,
        is_email_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    return user
