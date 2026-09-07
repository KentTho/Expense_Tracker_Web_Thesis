# FastAPI backend — Expense Tracker (Python 3.12)
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Cài dependency trước (tận dụng layer cache).
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy source.
COPY . .

EXPOSE 8000

# Chạy migration rồi khởi động API. DATABASE_URL/SECRET_KEY nạp từ ENV (compose/CI).
CMD ["sh", "-c", "python -m alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000"]
