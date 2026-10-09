from datetime import date
from decimal import Decimal
from schemas.income_schemas import IncomeCreate
from schemas.expense_schemas import ExpenseCreate
from schemas.transaction_schemas import TransactionCreate
import pytest


def test_income_create_empty_category_id_coerced_to_none():
    payload = IncomeCreate(
        amount=Decimal("100"),
        date=date(2026, 10, 9),
        category_id="",
    )
    assert payload.category_id is None


def test_expense_create_empty_category_id_coerced_to_none():
    payload = ExpenseCreate(
        amount=Decimal("100"),
        date=date(2026, 10, 9),
        category_id="",
    )
    assert payload.category_id is None


def test_transaction_create_empty_category_id_coerced_to_none():
    payload = TransactionCreate(
        type="income",
        amount=100.0,
        date=date(2026, 10, 9),
        category_id="",
    )
    assert payload.category_id is None
