from pydantic import BaseModel, Field
from typing import Optional


class NutritionPlanRequest(BaseModel):
    age: int = Field(..., ge=10, le=100)
    gender: str
    height_cm: float = Field(..., gt=0)
    weight_kg: float = Field(..., gt=0)

    activity_level: str
    goal: str
    diet_type: str

    meals_per_day: int = Field(..., ge=3, le=6)
    water_intake_liters: float = Field(..., ge=0, le=10)

    allergies: Optional[str] = ""
    health_conditions: Optional[str] = ""
    food_avoid: Optional[str] = ""
    daily_food_notes: Optional[str] = ""
    notes: Optional[str] = ""