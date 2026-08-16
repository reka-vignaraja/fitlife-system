from typing import Optional

from pydantic import BaseModel, EmailStr


class ProfileCreateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[str] = None

    health_conditions: Optional[str] = None
    injury_details: Optional[str] = None

    fitness_goal: Optional[str] = None
    fitness_level: Optional[str] = None
    workout_days: Optional[str] = None
    equipment: Optional[str] = None

    diet_preference: Optional[str] = None
    allergies: Optional[str] = None


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[str] = None

    health_conditions: Optional[str] = None
    injury_details: Optional[str] = None

    fitness_goal: Optional[str] = None
    fitness_level: Optional[str] = None
    workout_days: Optional[str] = None
    equipment: Optional[str] = None

    diet_preference: Optional[str] = None
    allergies: Optional[str] = None