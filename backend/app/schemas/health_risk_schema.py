from pydantic import BaseModel, Field
from typing import Optional


class HealthRiskRequest(BaseModel):
    age: int = Field(..., ge=10, le=100)
    gender: str

    height_cm: float = Field(..., gt=0)
    weight_kg: float = Field(..., gt=0)

    activity_level: str

    systolic_bp: int = Field(..., ge=70, le=250)
    diastolic_bp: int = Field(..., ge=40, le=150)
    cholesterol: int = Field(..., ge=80, le=400)

    smoker: Optional[str] = "No"