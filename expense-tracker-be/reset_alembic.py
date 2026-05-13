import os

from sqlalchemy import create_engine, text
from core.config import settings

LOCAL_ENVIRONMENTS = {"local", "dev", "development"}
RESET_CONFIRMATION = "I_UNDERSTAND_THIS_ONLY_RESETS_LOCAL_ALEMBIC_STATE"


def reset_alembic_stamp():
    """Dangerous local-only helper. Never run this against shared/prod data."""
    allow_reset = os.getenv("ALLOW_ALEMBIC_RESET", "").lower() == "true"
    app_env = os.getenv("APP_ENV", "").lower()
    confirmation = os.getenv("CONFIRM_ALEMBIC_RESET", "")

    if not allow_reset:
        raise SystemExit("Refusing to reset Alembic stamp. Set ALLOW_ALEMBIC_RESET=true for local recovery only.")
    if app_env not in LOCAL_ENVIRONMENTS:
        raise SystemExit("Refusing to reset Alembic stamp unless APP_ENV is explicitly local/dev/development.")
    if confirmation != RESET_CONFIRMATION:
        raise SystemExit(
            "Refusing to reset Alembic stamp. Set CONFIRM_ALEMBIC_RESET="
            f"{RESET_CONFIRMATION} only for local recovery."
        )

    engine = create_engine(settings.DATABASE_URL)
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        print("Alembic stamp reset completed for local recovery.")


if __name__ == "__main__":
    reset_alembic_stamp()
