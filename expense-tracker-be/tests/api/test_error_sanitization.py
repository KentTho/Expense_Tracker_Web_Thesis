"""SEC-ERR — chống rò rỉ chi tiết exception ra client/hội thoại (F5/F6).

Mỗi test tiêm một sentinel vào exception nội bộ rồi khẳng định sentinel KHÔNG
xuất hiện trong phản hồi client, đồng thời client vẫn nhận thông điệp generic ổn định.
"""
import pytest

SENTINEL = "SENTINEL_INTERNAL_LEAK_9137"


def test_sec_err_auth_no_leak(monkeypatch):
    """SEC-ERR-AUTH: lỗi lạ khi verify Firebase token → 401 generic, không lộ nội tình."""
    from services import auth_token_db
    from firebase_admin import auth as fb_auth
    from fastapi import HTTPException

    def _boom(_token):
        raise RuntimeError(SENTINEL)

    monkeypatch.setattr(fb_auth, "verify_id_token", _boom)
    with pytest.raises(HTTPException) as ei:
        auth_token_db.verify_token_and_get_payload("dummy-token")
    assert ei.value.status_code == 401
    assert SENTINEL not in str(ei.value.detail)
    assert ei.value.detail == "Token verification failed"


def test_sec_err_admin_no_leak(client, monkeypatch):
    """SEC-ERR-ADMIN: nhánh 500 của admin route trả detail generic, không lộ str(e)."""
    import main
    from services.auth_token_db import get_current_admin_user
    from cruds import crud_admin

    class _Admin:
        email = "admin@test.local"
        is_admin = True

    def _boom(*args, **kwargs):
        raise RuntimeError(SENTINEL)

    monkeypatch.setattr(crud_admin, "admin_create_default_category", _boom)
    main.app.dependency_overrides[get_current_admin_user] = lambda: _Admin()
    try:
        resp = client.post("/admin/categories", json={"name": "X", "type": "expense"})
    finally:
        main.app.dependency_overrides.pop(get_current_admin_user, None)

    assert resp.status_code == 500
    assert SENTINEL not in resp.text
    assert resp.json()["detail"] == "Failed to create category"


def test_sec_err_security_no_leak(client, db_session, seed_user, monkeypatch):
    """SEC-ERR-SECURITY: lỗi lạ khi bật 2FA → 400 generic, không lộ nội tình."""
    import main
    from services.auth_token_db import get_current_user_db
    from cruds import crud_security

    def _boom(*args, **kwargs):
        raise RuntimeError(SENTINEL)

    monkeypatch.setattr(crud_security, "enable_2fa_generate_secret", _boom)
    main.app.dependency_overrides[get_current_user_db] = lambda: seed_user
    try:
        resp = client.post("/security/2fa/enable-start")
    finally:
        main.app.dependency_overrides.pop(get_current_user_db, None)

    assert resp.status_code == 400
    assert SENTINEL not in resp.text
    assert resp.json()["detail"] == "Could not start 2FA setup"


def test_sec_err_chat_tool_no_leak(db_session, seed_user, monkeypatch):
    """SEC-ERR-CHAT: tool FinBot không được nhét text exception nhà cung cấp vào hội thoại."""
    from services.chat_tools import get_finbot_tools
    from cruds import crud_summary

    def _boom(*args, **kwargs):
        raise RuntimeError(SENTINEL)

    monkeypatch.setattr(crud_summary, "get_financial_kpi_summary", _boom)
    tools = get_finbot_tools(db_session, seed_user)
    balance_tool = next(t for t in tools if t.name == "get_balance")
    result = balance_tool.func()
    assert SENTINEL not in str(result)
