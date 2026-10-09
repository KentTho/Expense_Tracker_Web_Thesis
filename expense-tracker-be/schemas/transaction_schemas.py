from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .category_schemas import CategoryOut


class TransactionBase(BaseModel):
    """Base schema for unified income/expense transactions."""

    type: str
    amount: float = Field(..., gt=0)
    currency_code: str = "USD"
    date: date
    note: Optional[str] = None
    category_name: Optional[str] = None
    category_id: Optional[UUID] = None
    emoji: Optional[str] = None

    @field_validator("category_id", mode="before")
    @classmethod
    def empty_category_id_to_none(cls, v):
        if v == "" or v is None:
            return None
        return v


class TransactionCreate(TransactionBase):
    """Schema for creating a unified transaction."""

    pass


class TransactionOut(TransactionBase):
    """Schema returned by transaction APIs."""

    id: UUID
    user_id: UUID
    created_at: Optional[datetime] = None
    category: Optional[CategoryOut] = None

    model_config = ConfigDict(from_attributes=True)


class RecentTransactionOut(BaseModel):
    """Schema for recent transactions."""

    id: UUID
    type: str
    emoji: Optional[str] = None
    amount: float = Field(..., gt=0)
    currency_code: str = "USD"
    date: date
    category_name: Optional[str] = None
    note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
