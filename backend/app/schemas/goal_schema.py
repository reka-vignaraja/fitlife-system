from pydantic import BaseModel, Field
from typing import Optional


class GoalCreateRequest(BaseModel):
    title: str = Field(..., min_length=2)
    category: str
    target_value: float = Field(..., gt=0)
    current_value: float = Field(..., ge=0)
    unit: str
    deadline: str
    priority: str
    notes: Optional[str] = ""


class GoalProgressUpdateRequest(BaseModel):
    current_value: float = Field(..., ge=0)