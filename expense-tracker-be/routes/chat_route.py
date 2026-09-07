# routes/chat_route.py
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from db.database import get_db
from schemas.chat_schema import ChatRequest
from services.auth_token_db import get_current_user_db
from services.chat_service import process_chat_message
from core.rate_limit import limiter, CHAT_RATE_LIMIT

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chatbot"])


@router.post("/send")
@limiter.limit(CHAT_RATE_LIMIT)  # F3/F5: chặn abuse gọi LLM (cost/injection surface).
async def send_message(
    request: Request,
    payload: ChatRequest,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    try:
        # Truyền history vào service
        response_text = await process_chat_message(db, current_user, payload.message, payload.history)
        return {"reply": response_text}
    except Exception:
        logger.exception("Chat processing error")  # F5/F6: log chi tiết, client nhận generic.
        raise HTTPException(status_code=500, detail="Chat service temporarily unavailable")
