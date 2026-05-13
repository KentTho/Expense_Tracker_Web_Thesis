from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

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


class TransactionCreate(TransactionBase):
    """Schema for creating a unified transaction."""

    pass


class TransactionOut(TransactionBase):
    """Schema returned by transaction APIs."""

    id: UUID
    user_id: UUID
    created_at: datetime
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
