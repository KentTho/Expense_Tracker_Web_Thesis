"""Health/readiness + CORS contract (offline-safe).

Không cần Postgres thật: dùng TestClient trực tiếp trên app.
- /health luôn 200 (liveness).
- /ready: DB bắt buộc → offline (không có DB) trả 503 nhưng payload đúng cấu trúc.
- CORS: origin hợp lệ được echo; origin lạ KHÔNG được cấp; preflight cho Authorization.
"""
from fastapi.testclient import TestClient

import main

client = TestClient(main.app, raise_server_exceptions=False)

ALLOWED_ORIGIN = "http://localhost:5173"
DISALLOWED_ORIGIN = "http://evil.example.com"


def test_health_liveness_ok():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_ready_shape_and_status():
    """Readiness trả cấu trúc ổn định; status ∈ {200,503} tùy DB có sẵn."""
    resp = client.get("/ready")
    assert resp.status_code in (200, 503)
    body = resp.json()
    assert "status" in body and "checks" in body
    assert set(body["checks"].keys()) == {"database", "redis"}
    # Không rò rỉ chi tiết kết nối/secret.
    assert "://" not in resp.text  # không có DATABASE_URL/DSN trong payload


def test_cors_01_allowed_origin_preflight():
    resp = client.options(
        "/health",
        headers={
            "Origin": ALLOWED_ORIGIN,
            "Access-Control-Request-Method": "GET",
        },
    )
    assert resp.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN


def test_cors_02_disallowed_origin_not_granted():
    resp = client.get("/health", headers={"Origin": DISALLOWED_ORIGIN})
    # Origin lạ KHÔNG được phản chiếu vào allow-origin.
    assert resp.headers.get("access-control-allow-origin") != DISALLOWED_ORIGIN


def test_cors_03_authorization_header_preflight():
    resp = client.options(
        "/health",
        headers={
            "Origin": ALLOWED_ORIGIN,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )
    allow_headers = (resp.headers.get("access-control-allow-headers") or "").lower()
    assert "authorization" in allow_headers or "*" in allow_headers
