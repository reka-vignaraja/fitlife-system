from pydantic import BaseModel, Field
from typing import Optional


class BMIRequest(BaseModel):
    age: int = Field(..., ge=10, le=100)
    gender: str
    height_cm: float = Field(..., gt=0)
    weight_kg: float = Field(..., gt=0)
    activity_level: Optional[str] = ""
    goal: Optional[str] = ""