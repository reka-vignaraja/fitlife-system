from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings
from app.database.mongodb import get_database
from app.schemas.nutrition_schema import NutritionPlanRequest
from app.services.nutrition_service import generate_ai_nutrition_plan


router = APIRouter(
    prefix="/api/nutrition",
    tags=["AI Nutrition Plan"],
)

security = HTTPBearer()


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


def convert_request_to_dict(data: NutritionPlanRequest):
    try:
        return data.model_dump()
    except Exception:
        return data.dict()


@router.post("/generate")
def generate_nutrition_plan(
    data: NutritionPlanRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        db = get_database()
        nutrition_collection = db["nutrition_logs"]

        nutrition_result = generate_ai_nutrition_plan(data)
        request_data = convert_request_to_dict(data)

        clean_result = {}

        for key, value in nutrition_result.items():
            if key != "_id":
                clean_result[key] = value

        nutrition_score = (
            clean_result.get("nutrition_score")
            or clean_result.get("score")
            or 0
        )

        save_data = {
            **clean_result,
            "user_id": user_id,
            "user_object_id": ObjectId(user_id),
            "nutrition_score": nutrition_score,
            "input_data": request_data,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        inserted = nutrition_collection.insert_one(save_data)

        nutrition_result["_id"] = str(inserted.inserted_id)
        nutrition_result["user_id"] = user_id
        nutrition_result["saved_to_progress_report"] = True

        return nutrition_result

    except HTTPException as e:
        raise e

    except Exception as e:
        print("NUTRITION PLAN ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))