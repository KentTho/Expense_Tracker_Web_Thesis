# routes/chat_route.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db.database import get_db
from services.auth_token_db import get_current_user_db
from services.chat_service import process_chat_message

router = APIRouter(prefix="/chat", tags=["Chatbot"])

class ChatRequest(BaseModel):
    message: str

@router.post("/send")
async def send_message(
    payload: ChatRequest,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    try:
        # Gọi service xử lý (LangChain + Gemini)
        response_text = process_chat_message(db, current_user, payload.message)
        return {"reply": response_text}
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))