from pydantic import BaseModel, Field
from typing import Optional


class FitnessPlanRequest(BaseModel):
    age: int = Field(..., ge=10, le=100)
    gender: str
    height_cm: float = Field(..., gt=0)
    weight_kg: float = Field(..., gt=0)

    fitness_level: str
    activity_level: str
    goal: str

    workout_days_per_week: int = Field(..., ge=2, le=6)
    duration_minutes: int = Field(..., ge=15, le=120)

    equipment: str
    preferred_workouts: Optional[str] = ""
    injuries: Optional[str] = ""
    health_conditions: Optional[str] = ""
    notes: Optional[str] = ""