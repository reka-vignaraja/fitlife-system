from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings
from app.database.mongodb import get_database
from app.schemas.sleep_schema import SleepAnalysisRequest
from app.services.sleep_service import generate_ai_sleep_analysis


router = APIRouter(
    prefix="/api/sleep",
    tags=["AI Sleep Tracking"],
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


def convert_request_to_dict(data: SleepAnalysisRequest):
    try:
        return data.model_dump()
    except Exception:
        return data.dict()


@router.post("/analyze")
def analyze_sleep(
    data: SleepAnalysisRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        db = get_database()
        sleep_collection = db["sleep_records"]

        sleep_result = generate_ai_sleep_analysis(data)
        request_data = convert_request_to_dict(data)

        clean_result = {}

        for key, value in sleep_result.items():
            if key != "_id":
                clean_result[key] = value

        sleep_score = (
            clean_result.get("sleep_score")
            or clean_result.get("score")
            or 0
        )

        sleep_status = (
            clean_result.get("sleep_status")
            or clean_result.get("sleep_quality_status")
            or "Not calculated"
        )

        save_data = {
            **clean_result,
            "user_id": user_id,
            "user_object_id": ObjectId(user_id),
            "sleep_score": sleep_score,
            "sleep_status": sleep_status,
            "input_data": request_data,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        inserted = sleep_collection.insert_one(save_data)

        sleep_result["_id"] = str(inserted.inserted_id)
        sleep_result["user_id"] = user_id
        sleep_result["saved_to_progress_report"] = True

        return sleep_result

    except HTTPException as e:
        raise e

    except Exception as e:
        print("SLEEP ANALYSIS ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))