# core/exceptions.py
"""Error sanitization (F5, F6).

Nguyên tắc: log CHI TIẾT ở server (stack trace vào log), nhưng client CHỈ nhận
JSON chuẩn {"detail": "..."} — không bao giờ lộ str(e) / traceback / nội tình.

register_exception_handlers(app) được gọi trong main.py.
"""
import logging

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request

logger = logging.getLogger(__name__)


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """HTTPException do dev chủ động raise → detail đã an toàn, giữ nguyên."""
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Lỗi validate payload → thông điệp generic, không echo cấu trúc nội bộ."""
    return JSONResponse(status_code=422, content={"detail": "Invalid request payload"})


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Mọi lỗi chưa bắt → 500 generic. Chi tiết chỉ vào server log."""
    logger.exception("Unhandled error at %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


def register_exception_handlers(app) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
