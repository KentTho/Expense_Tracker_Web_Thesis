"""Wave 0 harness sanity check.

Mục đích DUY NHẤT: chứng minh pytest có thể discover + execute trong môi trường
venv của backend. ĐÂY KHÔNG PHẢI business regression coverage.
KHÔNG import application source, KHÔNG chạm DB/Firebase/Gemini/network.
"""


def test_pytest_environment_boots():
    """Harness khởi động được: phép toán thuần, không side-effect."""
    assert 1 + 1 == 2


def test_python_stdlib_available():
    """Stdlib có sẵn — xác nhận interpreter venv chạy đúng."""
    import json
    import decimal

    assert json.loads('{"ok": true}')["ok"] is True
    assert decimal.Decimal("0.1") + decimal.Decimal("0.2") == decimal.Decimal("0.3")
