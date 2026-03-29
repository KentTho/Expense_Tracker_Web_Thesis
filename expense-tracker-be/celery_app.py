# celery_app.py
from celery import Celery
from core.config import settings

celery_app = Celery(
    "expense_tracker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["tasks.export_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
)