from typing import Optional, List
from pydantic import BaseModel, Field


class DietPlanRequest(BaseModel):
    user_id: Optional[str] = None

    age: int = Field(..., ge=10, le=100)
    gender: str

    height_cm: float = Field(..., ge=100, le=230)
    weight_kg: float = Field(..., ge=30, le=250)

    # Basic frontend fields
    activity_level: str = "moderate"
    goal: str = "weight loss"
    diet_type: str = "balanced"
    meals_per_day: int = Field(3, ge=3, le=6)

    allergies: Optional[str] = "None"
    food_avoid: Optional[str] = "None"
    health_conditions: Optional[str] = "None"

    # Advanced diet model fields
    disease_type: Optional[str] = "None"
    severity: Optional[str] = "None"
    physical_activity_level: Optional[str] = None

    daily_caloric_intake: Optional[float] = None
    cholesterol_mg_dl: Optional[float] = None
    blood_pressure_mmhg: Optional[float] = None
    glucose_mg_dl: Optional[float] = None

    dietary_restrictions: Optional[str] = None
    preferred_cuisine: Optional[str] = "Any"

    weekly_exercise_hours: Optional[float] = None
    adherence_to_diet_plan: Optional[float] = None
    dietary_nutrient_imbalance_score: Optional[float] = None


class DietFoodItem(BaseModel):
    name: str
    grams: int


class DietMealItem(BaseModel):
    meal: str
    target_calories: int
    foods: List[str]
    food_items: List[DietFoodItem] = Field(default_factory=list)
    portion_guide: str