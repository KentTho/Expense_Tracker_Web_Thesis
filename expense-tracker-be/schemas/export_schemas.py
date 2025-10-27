from pydantic import BaseModel


class ExportResponse(BaseModel):
    message: str
    file_url: str
