"""Wave 01 — Characterization tests cho Security Hardening.

Khóa hành vi AN TOÀN sau khi fix F1/F2/F3/F5/F6/F15. Nếu revert bất kỳ fix nào,
test tương ứng sẽ FAIL (đỏ) → chứng minh lỗ hổng có thật và fix có tác dụng.

Ràng buộc: KHÔNG chạm DB thật (mock get_db + authenticate_user),
KHÔNG đọc/in secret, KHÔNG gọi network ngoài.
"""
import os
import subprocess
import sys

import pytest
from unittest.mock import MagicMock

# Đảm bảo ENV bắt buộc có mặt TRƯỚC khi import app (hermetic; .env chỉ lấp chỗ trống).
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/testdb")

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402
from db.database import get_db  # noqa: E402
from cruds import crud_user  # noqa: E402
from core.rate_limit import limiter  # noqa: E402

# tests/api/test_security.py -> lên 3 cấp là thư mục backend.
BE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    """Cô lập bucket rate-limit giữa các test (in-memory storage dùng chung process)."""
    limiter.reset()
    yield
    limiter.reset()


@pytest.fixture
def client():
    """TestClient KHÔNG kích hoạt lifespan (tránh seed DB thật); get_db được mock."""
    def _fake_db():
        yield MagicMock()

    main.app.dependency_overrides[get_db] = _fake_db
    test_client = TestClient(main.app, raise_server_exceptions=False)
    try:
        yield test_client
    finally:
        main.app.dependency_overrides.clear()


# --- SEC-01 (F1/F2): FAIL-CLOSED ------------------------------------------------
def test_config_fail_closed():
    """Thiếu SECRET_KEY → Settings() phải raise (app từ chối khởi động)."""
    code = (
        "import os;"
        "os.environ.pop('SECRET_KEY', None);"
        "os.environ['DATABASE_URL']='postgresql://x:x@localhost:5432/x';"
        "from core.config import Settings;"
        "Settings(_env_file=None)"
    )
    env = {k: v for k, v in os.environ.items() if k != "SECRET_KEY"}
    env["PYTHONPATH"] = BE_DIR

    proc = subprocess.run(
        [sys.executable, "-c", code],
        cwd=BE_DIR,
        env=env,
        capture_output=True,
        text=True,
    )
    assert proc.returncode != 0, "App KHÔNG được khởi động khi thiếu SECRET_KEY (fail-closed)"
    # Lỗi phải nêu tên field thiếu, KHÔNG in giá trị secret nào.
    assert "SECRET_KEY" in (proc.stdout + proc.stderr)


# --- SEC-02 (F3): RATE LIMITING -------------------------------------------------
def test_rate_limiting(client, monkeypatch):
    """Gọi /auth/login_sync vượt ngưỡng 5/phút → xuất hiện HTTP 429."""
    monkeypatch.setattr(crud_user, "authenticate_user", lambda db, u, p: None)  # 401, không chạm DB

    statuses = []
    for _ in range(7):
        resp = client.post(
            "/auth/login_sync",
            data={"username": "user@example.com", "password": "wrong"},
        )
        statuses.append(resp.status_code)

    assert 429 in statuses, f"Phải có 429 khi vượt ngưỡng; nhận: {statuses}"
    assert statuses.index(429) >= 5, f"5 request đầu không được bị chặn; nhận: {statuses}"


# --- SEC-03 (F5/F6): ERROR SANITIZATION ----------------------------------------
def test_error_sanitization(client, monkeypatch):
    """Lỗi server nội bộ → response generic, KHÔNG lộ str(e)/traceback."""
    secret_marker = "SENSITIVE_DB_PASSWORD_LEAK_12345"

    def _boom(*args, **kwargs):
        raise RuntimeError(secret_marker)

    monkeypatch.setattr(crud_user, "authenticate_user", _boom)

    resp = client.post(
        "/auth/login_sync",
        data={"username": "user@example.com", "password": "x"},
    )
    assert resp.status_code == 500
    assert resp.json() == {"detail": "Internal Server Error"}
    assert secret_marker not in resp.text
    assert "Traceback" not in resp.text
