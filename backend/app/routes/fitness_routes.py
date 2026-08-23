from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.schemas.fitness_schema import FitnessPlanRequest
from app.services.fitness_service import (
    generate_ai_fitness_plan,
    get_latest_fitness_plan,
)
from app.core.config import settings


router = APIRouter(
    prefix="/api/fitness",
    tags=["AI Fitness Guider"],
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


@router.post("/generate")
def generate_fitness_plan(
    data: FitnessPlanRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        return generate_ai_fitness_plan(data, user_id)

    except HTTPException:
        raise

    except Exception as e:
        print("FITNESS PLAN ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest-plan")
def latest_fitness_plan(
    user_id: str = Depends(get_current_user_id),
):
    try:
        return get_latest_fitness_plan(user_id)

    except HTTPException:
        raise

    except Exception as e:
        print("LATEST FITNESS PLAN ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))