"""Unit tests for FinBot chat tools hardening (Wave 05B).

Covers:
- Batch transactions pre-validation & atomic rollback.
- Admin emergency reset safety & explicit confirmation enforcement.
"""
from decimal import Decimal
from unittest.mock import MagicMock, patch
import pytest

from services.chat_tools import (
    get_finbot_tools,
    CreateTransactionInput,
    BatchTransactionInput,
    AdminResetSecurityInput,
)
from models import User


@pytest.fixture
def mock_db():
    db = MagicMock()
    return db


import uuid

@pytest.fixture
def mock_user():
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        name="Test User",
        currency_code="VND",
        is_admin=True
    )
    return user


def test_batch_transactions_empty(mock_db, mock_user):
    tools = get_finbot_tools(mock_db, mock_user)
    tool_map = {t.name: t for t in tools}
    batch_tool = tool_map["create_batch_transactions"]

    res = batch_tool.invoke({"transactions": []})
    assert "Danh sách giao dịch trống" in res


def test_batch_transactions_invalid_type(mock_db, mock_user):
    tools = get_finbot_tools(mock_db, mock_user)
    tool_map = {t.name: t for t in tools}
    batch_tool = tool_map["create_batch_transactions"]

    items = [
        CreateTransactionInput(type="crypto", amount=100000, category_name="Đầu tư", note="test")
    ]
    res = batch_tool.invoke({"transactions": items})
    assert "Loại 'crypto' không hợp lệ" in res
    assert "Hủy toàn bộ đợt ghi" in res


def test_batch_transactions_negative_amount(mock_db, mock_user):
    tools = get_finbot_tools(mock_db, mock_user)
    tool_map = {t.name: t for t in tools}
    batch_tool = tool_map["create_batch_transactions"]

    items = [
        CreateTransactionInput(type="expense", amount=-50000, category_name="Ăn uống", note="test")
    ]
    res = batch_tool.invoke({"transactions": items})
    assert "Số tiền phải lớn hơn 0" in res
    assert "Hủy toàn bộ đợt ghi" in res


def test_batch_transactions_invalid_date(mock_db, mock_user):
    tools = get_finbot_tools(mock_db, mock_user)
    tool_map = {t.name: t for t in tools}
    batch_tool = tool_map["create_batch_transactions"]

    items = [
        CreateTransactionInput(type="expense", amount=50000, category_name="Ăn uống", note="test", date_str="2026/13/45")
    ]
    res = batch_tool.invoke({"transactions": items})
    assert "không đúng định dạng YYYY-MM-DD" in res
    assert "Hủy toàn bộ đợt ghi" in res


@patch("services.chat_tools.crud_income.create_income")
@patch("services.chat_tools.crud_expense.create_expense")
def test_batch_transactions_atomic_rollback_on_error(mock_create_expense, mock_create_income, mock_db, mock_user):
    tools = get_finbot_tools(mock_db, mock_user)
    tool_map = {t.name: t for t in tools}
    batch_tool = tool_map["create_batch_transactions"]

    # First expense succeeds, second throws exception
    mock_create_expense.side_effect = [MagicMock(), RuntimeError("Database error")]

    items = [
        CreateTransactionInput(type="expense", amount=50000, category_name="Ăn trưa", note="Phở"),
        CreateTransactionInput(type="expense", amount=30000, category_name="Cà phê", note="Bạc xỉu")
    ]
    res = batch_tool.invoke({"transactions": items})
    assert "Đã hoàn tác toàn bộ" in res
    mock_db.rollback.assert_called_once()


@patch("services.chat_tools.crud_income.create_income")
@patch("services.chat_tools.crud_expense.create_expense")
def test_batch_transactions_success(mock_create_expense, mock_create_income, mock_db, mock_user):
    tools = get_finbot_tools(mock_db, mock_user)
    tool_map = {t.name: t for t in tools}
    batch_tool = tool_map["create_batch_transactions"]

    items = [
        CreateTransactionInput(type="income", amount=15000000, category_name="Lương", note="Tháng 10"),
        CreateTransactionInput(type="expense", amount=45000, category_name="Ăn trưa", note="Cơm tấm")
    ]
    res = batch_tool.invoke({"transactions": items})
    assert "[REFRESH]" in res
    assert "Đã ghi nhận thành công 2 giao dịch" in res
    mock_create_income.assert_called_once()
    mock_create_expense.assert_called_once()


def test_admin_emergency_reset_requires_confirmation(mock_db, mock_user):
    tools = get_finbot_tools(mock_db, mock_user)
    tool_map = {t.name: t for t in tools}
    reset_tool = tool_map["admin_emergency_reset"]

    # Invocation without confirm=True
    res = reset_tool.invoke({"email": "victim@example.com", "confirm": False})
    assert "YÊU CẦU XÁC NHẬN BẢO MẬT" in res
    assert "Xác nhận cứu hộ victim@example.com" in res
    # Ensure no db commit was made
    mock_db.commit.assert_not_called()


@patch("services.chat_tools.crud_user.get_user_by_email")
@patch("services.chat_tools.crud_audit.log_action")
def test_admin_emergency_reset_confirmed(mock_audit, mock_get_user, mock_db, mock_user):
    tools = get_finbot_tools(mock_db, mock_user)
    tool_map = {t.name: t for t in tools}
    reset_tool = tool_map["admin_emergency_reset"]

    target = User(id=uuid.uuid4(), email="victim@example.com", is_2fa_enabled=True, otp_secret="SECRET")
    mock_get_user.return_value = target

    res = reset_tool.invoke({"email": "victim@example.com", "confirm": True})
    assert "Đã CỨU HỘ user victim@example.com thành công" in res
    assert target.is_2fa_enabled is False
    assert target.otp_secret is None
    assert target.last_session_key == "RESET_BY_ADMIN"
    mock_db.commit.assert_called_once()
    mock_audit.assert_called_once()
