"""MIG-01..03 — Migration / schema regression (Wave 02B).

Chạy trên Postgres test thật (TEST_DATABASE_URL). Chứng minh:
- MIG-01: rebuild-from-zero (downgrade base -> upgrade head) dựng đủ 7 bảng canonical.
- MIG-02: parity schema DB <-> ORM Base.metadata.
- MIG-03: PK / FK (ondelete CASCADE) / unique index đúng kỳ vọng.
"""
from sqlalchemy import inspect

EXPECTED_TABLES = {
    "users", "categories", "transactions",
    "incomes", "expenses", "audit_logs", "system_settings",
}


def test_mig_01_rebuild_from_zero(engine):
    """Sau downgrade base + upgrade head (fixture engine đã làm) -> đủ 7 bảng + alembic_version."""
    insp = inspect(engine)
    tables = set(insp.get_table_names())
    assert EXPECTED_TABLES.issubset(tables), f"Thiếu bảng: {EXPECTED_TABLES - tables}"
    assert "alembic_version" in tables

    with engine.connect() as conn:
        from sqlalchemy import text
        rev = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
    assert rev == "a1b2c3d4e5f6", f"Head revision sai: {rev}"


def test_mig_02_schema_orm_parity(engine):
    """set(bảng DB) - alembic_version == set(bảng trong Base.metadata)."""
    import models  # noqa: F401  (nạp toàn bộ model vào Base.metadata)
    from db.database import Base

    insp = inspect(engine)
    db_tables = set(insp.get_table_names()) - {"alembic_version"}
    orm_tables = set(Base.metadata.tables.keys())
    assert db_tables == orm_tables, f"Lệch parity: chỉ-DB={db_tables - orm_tables}, chỉ-ORM={orm_tables - db_tables}"


def test_mig_03_constraints_and_fks(engine):
    """FK ondelete CASCADE trên transactions.user_id + unique index email."""
    insp = inspect(engine)

    # PK
    assert insp.get_pk_constraint("transactions")["constrained_columns"] == ["id"]

    # FK transactions -> users (CASCADE) và -> categories
    fks = {tuple(fk["constrained_columns"]): fk for fk in insp.get_foreign_keys("transactions")}
    assert ("user_id",) in fks, "Thiếu FK transactions.user_id"
    assert fks[("user_id",)]["referred_table"] == "users"
    assert fks[("user_id",)].get("options", {}).get("ondelete", "").upper() == "CASCADE"
    assert ("category_id",) in fks and fks[("category_id",)]["referred_table"] == "categories"

    # unique index trên users.email
    email_idx = [ix for ix in insp.get_indexes("users") if ix["column_names"] == ["email"]]
    assert email_idx and email_idx[0]["unique"], "users.email phải có unique index"
