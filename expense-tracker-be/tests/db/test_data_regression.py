"""DAT-01..06 + F7 — Data / business regression (Wave 02B).

Chạy trên Postgres test thật, mỗi test cô lập bằng transaction rollback (db_session).
Bám sát REST contract hiện tại (không đổi response shape).
"""
import uuid
from decimal import Decimal

import pytest
from fastapi import HTTPException

from cruds import crud_category, crud_transaction, crud_summary


def _make_category(db, user_id, name, ctype):
    return crud_category.create_category(db, user_id=user_id, name=name, type=ctype)


def _add_txn(db, user_id, category, ctype, amount, when=None):
    from datetime import date
    return crud_transaction.create_transaction(
        db, user_id=user_id, category_id=category.id, type=ctype,
        amount=Decimal(str(amount)), transaction_date=when or date.today(),
    )


# --- DAT-01: seed default categories idempotent -------------------------------
def test_dat_01_seed_default_categories_idempotent(db_session):
    from models import category_model

    crud_summary  # keep import used
    crud_category.seed_default_categories(db_session)
    first = db_session.query(category_model.Category).filter(
        category_model.Category.user_id.is_(None)).count()
    crud_category.seed_default_categories(db_session)  # chạy lại
    second = db_session.query(category_model.Category).filter(
        category_model.Category.user_id.is_(None)).count()

    assert first == 17, f"Kỳ vọng 17 default categories, có {first}"
    assert second == first, "seed_default_categories phải idempotent (không nhân đôi)"


# --- DAT-02: dashboard/summary totals (crud layer) ----------------------------
def test_dat_02_financial_totals(db_session, seed_user):
    inc = _make_category(db_session, seed_user.id, "Salary", "income")
    exp = _make_category(db_session, seed_user.id, "Food", "expense")
    _add_txn(db_session, seed_user.id, inc, "income", 300)
    _add_txn(db_session, seed_user.id, exp, "expense", 100)

    kpi = crud_summary.get_financial_kpi_summary(db_session, seed_user.id)
    assert float(kpi["total_income"]) == 300.0
    assert float(kpi["total_expense"]) == 100.0

    dash = crud_summary.get_dashboard_data(db_session, seed_user.id)
    assert dash["summary"]["total_income"] == 300.0
    assert dash["summary"]["total_expense"] == 100.0
    assert dash["summary"]["total_balance"] == 200.0


# --- DAT-02b: REST contract intact (API) --------------------------------------
def test_dat_02b_summary_kpis_api(auth_client, db_session, seed_user):
    inc = _make_category(db_session, seed_user.id, "Salary", "income")
    _add_txn(db_session, seed_user.id, inc, "income", 500)

    resp = auth_client.get("/summary/kpis")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert float(body["total_income"]) == 500.0
    assert set(["total_income", "total_expense", "income_growth", "expense_growth"]).issubset(body)


# --- DAT-03: ownership isolation ---------------------------------------------
def test_dat_03_ownership_isolation(db_session, seed_user):
    from models import user_model

    other = user_model.User(
        id=uuid.uuid4(), email=f"other_{uuid.uuid4().hex[:6]}@test.local",
        currency_code="USD", currency_symbol="$", is_2fa_enabled=False,
        restrict_multi_device=False, is_admin=False, has_onboard=True, is_email_verified=True,
    )
    db_session.add(other)
    db_session.commit()

    cat = _make_category(db_session, seed_user.id, "Food", "expense")
    txn = _add_txn(db_session, seed_user.id, cat, "expense", 50)

    # 'other' KHÔNG được đụng giao dịch của seed_user
    assert crud_transaction.update_transaction(db_session, txn.id, other.id, {"amount": Decimal("999")}) is None
    assert crud_transaction.delete_transaction(db_session, txn.id, other.id) is None
    # chủ sở hữu vẫn thấy nguyên vẹn
    still = crud_transaction.list_transactions_for_user(db_session, seed_user.id)
    assert len(still) == 1 and float(still[0].amount) == 50.0


# --- DAT-04: money boundary (amount > 0) -------------------------------------
@pytest.mark.parametrize("bad", [0, -1, -100.5])
def test_dat_04_money_boundary(db_session, seed_user, bad):
    cat = _make_category(db_session, seed_user.id, "Food", "expense")
    with pytest.raises(HTTPException) as ei:
        _add_txn(db_session, seed_user.id, cat, "expense", bad)
    assert ei.value.status_code == 400


# --- DAT-05: rollback atomicity (category type mismatch -> no persist) --------
def test_dat_05_rollback_on_invalid_category(db_session, seed_user):
    from models import transaction_model

    income_cat = _make_category(db_session, seed_user.id, "Salary", "income")
    before = db_session.query(transaction_model.Transaction).count()
    # dùng category 'income' cho giao dịch 'expense' -> get_accessible_category_for_user raise 400
    with pytest.raises(HTTPException) as ei:
        _add_txn(db_session, seed_user.id, income_cat, "expense", 100)
    assert ei.value.status_code == 400
    after = db_session.query(transaction_model.Transaction).count()
    assert after == before, "Giao dịch lỗi không được persist (atomicity)"


# --- DAT-06: budget status (bugfix monthly_budget) ---------------------------
def test_dat_06_budget_status_uses_monthly_budget(db_session, seed_user):
    # seed_user.monthly_budget = 1000
    exp = _make_category(db_session, seed_user.id, "Food", "expense")
    _add_txn(db_session, seed_user.id, exp, "expense", 250)

    status = crud_summary.get_monthly_budget_status(db_session, seed_user.id)
    assert status["budget_limit"] == 1000.0, "Phải đọc monthly_budget (bugfix), không phải 0"
    assert status["spent_this_month"] == 250.0
    assert status["remaining_budget"] == 750.0


# --- F7: aggregate-on-read integrity dưới create/update/delete xen kẽ ---------
def test_f7_aggregate_integrity(db_session, seed_user):
    exp = _make_category(db_session, seed_user.id, "Food", "expense")
    inc = _make_category(db_session, seed_user.id, "Salary", "income")

    t1 = _add_txn(db_session, seed_user.id, exp, "expense", 100)
    _add_txn(db_session, seed_user.id, exp, "expense", 200)
    t3 = _add_txn(db_session, seed_user.id, exp, "expense", 300)
    _add_txn(db_session, seed_user.id, inc, "income", 1000)

    def expense_total():
        return float(crud_summary.get_financial_kpi_summary(db_session, seed_user.id)["total_expense"])

    assert expense_total() == 600.0  # 100+200+300, income không lẫn vào
    crud_transaction.delete_transaction(db_session, t3.id, seed_user.id)  # -300
    assert expense_total() == 300.0
    crud_transaction.update_transaction(db_session, t1.id, seed_user.id, {"amount": Decimal("150")})  # 100->150
    assert expense_total() == 350.0
    # income tổng vẫn độc lập, đúng
    assert float(crud_summary.get_financial_kpi_summary(db_session, seed_user.id)["total_income"]) == 1000.0
