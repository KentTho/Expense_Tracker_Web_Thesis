from sqlalchemy import create_engine, text
from core.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
    conn.commit()
    print("✅ Reset Alembic Stamp successfully.")
