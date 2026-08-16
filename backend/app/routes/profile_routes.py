from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel

from app.core.config import settings
from app.database.mongodb import get_database


router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"],
)

security = HTTPBearer()


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
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


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        token = credentials.credentials

        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        return user_id

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def build_profile_response(user):
    return {
        "id": str(user["_id"]),
        "full_name": user.get("name", ""),
        "email": user.get("email", ""),
        "email_verified": user.get("is_verified", False),

        "age": user.get("age", ""),
        "gender": user.get("gender", ""),
        "phone": user.get("phone", ""),
        "location": user.get("location", ""),

        "height_cm": user.get("height_cm", ""),
        "weight_kg": user.get("weight_kg", ""),
        "activity_level": user.get("activity_level", ""),
        "health_conditions": user.get("health_conditions", ""),
        "injury_details": user.get("injury_details", ""),

        "fitness_goal": user.get("fitness_goal", ""),
        "fitness_level": user.get("fitness_level", ""),
        "workout_days": user.get("workout_days", ""),
        "equipment": user.get("equipment", ""),

        "diet_preference": user.get("diet_preference", ""),
        "allergies": user.get("allergies", ""),
    }


@router.get("/me")
def get_my_profile(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    users_collection = db["users"]

    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user id")

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "message": "Profile fetched successfully",
        "profile": build_profile_response(user),
    }


@router.put("/me")
def update_my_profile(
    data: ProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()
    users_collection = db["users"]

    try:
        object_user_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user id")

    user = users_collection.find_one({"_id": object_user_id})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = {}

    if data.full_name is not None:
        update_data["name"] = data.full_name.strip()

    if data.age is not None:
        update_data["age"] = data.age

    if data.gender is not None:
        update_data["gender"] = data.gender

    if data.phone is not None:
        update_data["phone"] = data.phone

    if data.location is not None:
        update_data["location"] = data.location

    if data.height_cm is not None:
        update_data["height_cm"] = data.height_cm

    if data.weight_kg is not None:
        update_data["weight_kg"] = data.weight_kg

    if data.activity_level is not None:
        update_data["activity_level"] = data.activity_level

    if data.health_conditions is not None:
        update_data["health_conditions"] = data.health_conditions

    if data.injury_details is not None:
        update_data["injury_details"] = data.injury_details

    if data.fitness_goal is not None:
        update_data["fitness_goal"] = data.fitness_goal

    if data.fitness_level is not None:
        update_data["fitness_level"] = data.fitness_level

    if data.workout_days is not None:
        update_data["workout_days"] = data.workout_days

    if data.equipment is not None:
        update_data["equipment"] = data.equipment

    if data.diet_preference is not None:
        update_data["diet_preference"] = data.diet_preference

    if data.allergies is not None:
        update_data["allergies"] = data.allergies

    update_data["updated_at"] = datetime.utcnow()

    users_collection.update_one(
        {"_id": object_user_id},
        {"$set": update_data},
    )

    updated_user = users_collection.find_one({"_id": object_user_id})

    return {
        "message": "Profile updated successfully",
        "profile": build_profile_response(updated_user),
    }