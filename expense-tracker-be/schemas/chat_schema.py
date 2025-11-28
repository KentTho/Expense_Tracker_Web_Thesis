from pydantic import BaseModel, Field # 1. Import thêm Field
from typing import List, Dict, Annotated

class ChatRequest(BaseModel):
    message: str
    # 2. Sửa dòng này: Dùng Field(default_factory=list) thay vì = []
    history: Annotated[List[Dict[str, str]], Field(default_factory=list)]