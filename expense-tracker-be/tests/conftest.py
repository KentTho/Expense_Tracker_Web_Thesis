"""Pytest shared fixtures — Wave 0 minimal harness.

RÀNG BUỘC Wave 0 (KHÔNG vi phạm):
- KHÔNG import application (main.py / db.database) ở tầng module này để tránh
  side-effect: kết nối Neon, sys.exit khi thiếu DATABASE_URL, init Firebase, gọi Gemini.
- KHÔNG đọc/in secret. KHÔNG chạy Alembic. KHÔNG create_all trên DB target.
- Fixture cô lập cho các Wave sau (test DB ephemeral, dependency override) sẽ được
  bổ sung ở Wave 2, không phải Wave 0.
"""
