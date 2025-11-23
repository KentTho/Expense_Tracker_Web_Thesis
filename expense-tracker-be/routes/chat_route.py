# routes/chat_route.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from schemas.chat_schema import ChatRequest
from services.auth_token_db import get_current_user_db
from services.chat_service import process_chat_message

router = APIRouter(prefix="/chat", tags=["Chatbot"])


@router.post("/send")
async def send_message(
    payload: ChatRequest,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    try:
        # Truyền history vào service
        response_text = process_chat_message(db, current_user, payload.message, payload.history)
        return {"reply": response_text}
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))