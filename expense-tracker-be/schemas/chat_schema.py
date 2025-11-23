from pydantic import BaseModel, Field # 1. Import thêm Field
from typing import List, Dict

class ChatRequest(BaseModel):
    message: str
    # 2. Sửa dòng này: Dùng Field(default_factory=list) thay vì = []
    history: List[Dict[str, str]] = Field(default_factory=list)