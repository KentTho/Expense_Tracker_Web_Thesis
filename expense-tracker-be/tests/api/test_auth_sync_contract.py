"""AUTH-E2E contract cho /auth/sync (mock Firebase verifier — KHÔNG gọi Firebase thật).

Real Firebase signup/login = EXTERNAL_FIREBASE_E2E_GATE (làm ở Wave 04A1 với
project test non-production). Ở đây chỉ chứng minh HỢP ĐỒNG backend:
- /auth/sync idempotent theo firebase_uid (reconciliation).
- login-sau-partial-signup recover được (tạo app-user nếu chưa có).
- 2FA bật → trả pending_2fa, KHÔNG cấp access token.

Cần Postgres thật (TEST_DATABASE_URL); thiếu → fixture DB tự skip.
"""
import uuid


def _fake_decoded(uid, email, verified=True):
    return {"uid": uid, "email": email, "name": "Sync User", "email_verified": verified}


def _patch_verifier(monkeypatch, decoded):
    # Patch tên đã import trong namespace của route.
    monkeypatch.setattr(
        "routes.auth_route.verify_token_and_get_payload", lambda _token: decoded
    )


def _post_sync(client, email, uid, display_name="Sync User"):
    return client.post(
        "/auth/sync",
        headers={"Authorization": "Bearer dummy-firebase-token"},
        json={"email": email, "firebase_uid": uid, "display_name": display_name},
    )


def test_auth_sync_04_idempotent_same_uid(client, db_session, monkeypatch):
    """AUTH-E2E-04: sync 2 lần cùng uid → đúng 1 app-user, cùng id, đều có access token."""
    from models import user_model

    uid = f"fb_{uuid.uuid4().hex[:10]}"
    email = f"{uid}@test.local"
    _patch_verifier(monkeypatch, _fake_decoded(uid, email))

    r1 = _post_sync(client, email, uid)
    r2 = _post_sync(client, email, uid)

    assert r1.status_code == 200 and r2.status_code == 200
    assert r1.json().get("access_token") and r2.json().get("access_token")
    assert r1.json()["user"]["id"] == r2.json()["user"]["id"]

    count = (
        db_session.query(user_model.User)
        .filter(user_model.User.firebase_uid == uid)
        .count()
    )
    assert count == 1


def test_auth_sync_03_recover_after_partial_signup(client, db_session, monkeypatch):
    """AUTH-E2E-03: chưa có app-user (giả lập sync trước đó fail) → sync tạo mới & cấp token."""
    from models import user_model

    uid = f"fb_{uuid.uuid4().hex[:10]}"
    email = f"{uid}@test.local"
    _patch_verifier(monkeypatch, _fake_decoded(uid, email))

    assert (
        db_session.query(user_model.User)
        .filter(user_model.User.firebase_uid == uid)
        .count()
        == 0
    )

    resp = _post_sync(client, email, uid)
    assert resp.status_code == 200
    assert resp.json().get("access_token")
    assert (
        db_session.query(user_model.User)
        .filter(user_model.User.firebase_uid == uid)
        .count()
        == 1
    )


def test_auth_sync_2fa_returns_pending_not_access(client, db_session, monkeypatch):
    """2FA bật → requires_2fa + pending_token, KHÔNG có access_token."""
    from models import user_model

    uid = f"fb_{uuid.uuid4().hex[:10]}"
    email = f"{uid}@test.local"
    _patch_verifier(monkeypatch, _fake_decoded(uid, email))

    # Lần 1 tạo user, sau đó bật 2FA.
    first = _post_sync(client, email, uid)
    assert first.status_code == 200
    user = (
        db_session.query(user_model.User)
        .filter(user_model.User.firebase_uid == uid)
        .one()
    )
    user.is_2fa_enabled = True
    db_session.add(user)
    db_session.commit()

    second = _post_sync(client, email, uid)
    body = second.json()
    assert second.status_code == 200
    assert body.get("requires_2fa") is True
    assert body.get("pending_token")
    assert "access_token" not in body
