"""baseline full schema (Option C squash)

Single new-install baseline dựng đủ 7 bảng runtime từ DB rỗng:
users, categories, transactions, incomes, expenses, audit_logs, system_settings.

Thay thế revision autogenerate hỏng `e92cd622d537` (delta-as-base:
DROP incomes/expenses trên DB rỗng => crash, không tạo core tables => F4).

Reconcile cho DB có sẵn (vd Neon): sau khi xác minh schema khớp 7 bảng,
chạy `alembic stamp a1b2c3d4e5f6` (GATED — KHÔNG chạy trong wave này, cần phê duyệt).

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-07-30 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the full canonical schema from zero."""
    # --- users -----------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("firebase_uid", sa.String(length=255), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("password", sa.String(length=255), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("gender", sa.String(length=20), nullable=True),
        sa.Column("birthday", sa.Date(), nullable=True),
        sa.Column("profile_image", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("currency_symbol", sa.String(length=5), nullable=False),
        sa.Column("is_2fa_enabled", sa.Boolean(), nullable=False),
        sa.Column("otp_secret", sa.String(), nullable=True),
        sa.Column("restrict_multi_device", sa.Boolean(), nullable=False),
        sa.Column("last_session_key", sa.String(), nullable=True),
        sa.Column("is_admin", sa.Boolean(), nullable=False),
        sa.Column("monthly_budget", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("has_onboard", sa.Boolean(), nullable=False),
        sa.Column("is_email_verified", sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=True)
    op.create_index(op.f("ix_users_firebase_uid"), "users", ["firebase_uid"], unique=True)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # --- categories ------------------------------------------------------
    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("type", sa.String(length=10), nullable=False),
        sa.Column("color", sa.String(length=10), nullable=True),
        sa.Column("icon", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- transactions (unified, canonical write path) --------------------
    op.create_table(
        "transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(length=10), nullable=False),
        sa.Column("amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("category_name", sa.String(length=255), nullable=True),
        sa.Column("emoji", sa.String(length=64), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_transactions_id"), "transactions", ["id"], unique=False)

    # --- incomes (legacy, vestigial — kept for metadata parity) ----------
    op.create_table(
        "incomes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_name", sa.String(length=255), nullable=True),
        sa.Column("amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("emoji", sa.String(length=64), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_incomes_id"), "incomes", ["id"], unique=True)
    op.create_index("ix_income_user_date", "incomes", ["user_id", "date"], unique=False)
    op.create_index("ix_income_category_date", "incomes", ["category_id", "date"], unique=False)

    # --- expenses (legacy, vestigial — kept for metadata parity) ---------
    op.create_table(
        "expenses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_name", sa.String(length=255), nullable=True),
        sa.Column("amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("emoji", sa.String(length=64), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_expenses_id"), "expenses", ["id"], unique=True)
    op.create_index("ix_expense_user_date", "expenses", ["user_id", "date"], unique=False)
    op.create_index("ix_expense_category_date", "expenses", ["category_id", "date"], unique=False)

    # --- audit_logs ------------------------------------------------------
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("actor_email", sa.String(length=255), nullable=False),
        sa.Column("target", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- system_settings -------------------------------------------------
    op.create_table(
        "system_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("maintenance_mode", sa.Boolean(), nullable=True),
        sa.Column("allow_signup", sa.Boolean(), nullable=True),
        sa.Column("broadcast_message", sa.String(length=255), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_system_settings_id"), "system_settings", ["id"], unique=False)


def downgrade() -> None:
    """Drop the full canonical schema (reverse dependency order)."""
    op.drop_index(op.f("ix_system_settings_id"), table_name="system_settings")
    op.drop_table("system_settings")
    op.drop_table("audit_logs")
    op.drop_index("ix_expense_category_date", table_name="expenses")
    op.drop_index("ix_expense_user_date", table_name="expenses")
    op.drop_index(op.f("ix_expenses_id"), table_name="expenses")
    op.drop_table("expenses")
    op.drop_index("ix_income_category_date", table_name="incomes")
    op.drop_index("ix_income_user_date", table_name="incomes")
    op.drop_index(op.f("ix_incomes_id"), table_name="incomes")
    op.drop_table("incomes")
    op.drop_index(op.f("ix_transactions_id"), table_name="transactions")
    op.drop_table("transactions")
    op.drop_table("categories")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_firebase_uid"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
