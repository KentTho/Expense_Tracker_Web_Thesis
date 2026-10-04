"""Test CORS retention on all response types including 4xx and 5xx errors (CORS-ERR-01).

Contract requirement:
Allowed origins (production Vercel, Vercel preview, localhost) must retain
correct CORS headers for 2xx, 400, 401, 403, 404, 422, and sanitized 500 responses.
"""
from fastapi import APIRouter
from fastapi.testclient import TestClient

import main

client = TestClient(main.app, raise_server_exceptions=False)

ALLOWED_ORIGIN = "https://expense-tracker-web-thesis.vercel.app"
PREVIEW_ORIGIN = "https://expense-tracker-web-thesis-git-wave05-preview.vercel.app"
LOCAL_ORIGIN = "http://localhost:5173"
DISALLOWED_ORIGIN = "http://malicious-attacker.com"


# Register a temporary test route that intentionally raises an unhandled exception for 500 test
test_router = APIRouter()

@test_router.get("/_test_internal_error")
def trigger_error():
    raise RuntimeError("Intentional server test exception")

main.app.include_router(test_router)


def test_cors_err_01_2xx_has_cors():
    resp = client.get("/health", headers={"Origin": ALLOWED_ORIGIN})
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN


def test_cors_err_01_401_has_cors():
    resp = client.get("/auth/me", headers={"Origin": ALLOWED_ORIGIN})
    assert resp.status_code == 401
    assert resp.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN


def test_cors_err_01_404_has_cors():
    resp = client.get("/nonexistent-endpoint-xyz", headers={"Origin": ALLOWED_ORIGIN})
    assert resp.status_code == 404
    assert resp.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN


def test_cors_err_01_422_has_cors():
    resp = client.post("/auth/sync", headers={"Origin": ALLOWED_ORIGIN}, json={"invalid": "payload"})
    assert resp.status_code == 422
    assert resp.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN


def test_cors_err_01_500_has_cors():
    resp = client.get("/_test_internal_error", headers={"Origin": ALLOWED_ORIGIN})
    assert resp.status_code == 500
    assert resp.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN
    assert resp.headers.get("access-control-allow-credentials") == "true"
    # Ensure error is sanitized
    assert resp.json() == {"detail": "Internal Server Error"}
    assert "RuntimeError" not in resp.text


def test_cors_err_01_preview_origin_has_cors():
    resp = client.get("/_test_internal_error", headers={"Origin": PREVIEW_ORIGIN})
    assert resp.status_code == 500
    assert resp.headers.get("access-control-allow-origin") == PREVIEW_ORIGIN


def test_cors_err_01_disallowed_origin_no_cors():
    resp = client.get("/_test_internal_error", headers={"Origin": DISALLOWED_ORIGIN})
    assert resp.status_code == 500
    assert resp.headers.get("access-control-allow-origin") != DISALLOWED_ORIGIN
