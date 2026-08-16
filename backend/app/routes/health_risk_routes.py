from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings
from app.database.mongodb import get_database
from app.schemas.health_risk_schema import HealthRiskRequest
from app.services.health_risk_service import predict_health_risk


router = APIRouter(
    prefix="/api/health-risk",
    tags=["Health Risk Prediction"],
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


def convert_request_to_dict(data: HealthRiskRequest):
    try:
        return data.model_dump()
    except Exception:
        return data.dict()


@router.post("/predict")
def predict_risk(
    data: HealthRiskRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        db = get_database()
        health_collection = db["health_risk_predictions"]

        prediction_result = predict_health_risk(data)

        risk_level = (
            prediction_result.get("risk_level")
            or prediction_result.get("predicted_risk_level")
            or prediction_result.get("prediction")
            or prediction_result.get("health_risk")
            or prediction_result.get("risk")
            or "Not calculated"
        )

        confidence = (
            prediction_result.get("confidence")
            or prediction_result.get("confidence_score")
            or prediction_result.get("probability")
            or None
        )

        request_data = convert_request_to_dict(data)

        health_record = {
            "user_id": user_id,
            "user_object_id": ObjectId(user_id),
            "risk_level": risk_level,
            "predicted_risk_level": risk_level,
            "confidence": confidence,
            "input_data": request_data,
            "prediction_result": prediction_result,
            "created_at": datetime.utcnow(),
        }

        health_collection.insert_one(health_record)

        return prediction_result

    except HTTPException as e:
        raise e

    except Exception as e:
        print("HEALTH RISK PREDICTION ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))