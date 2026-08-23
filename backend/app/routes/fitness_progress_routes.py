from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings
from app.schemas.fitness_progress_schema import FitnessProgressRequest
from app.services.fitness_progress_service import (
    save_fitness_progress,
    get_latest_fitness_progress,
)


router = APIRouter(
    prefix="/api/fitness-progress",
    tags=["Fitness Progress Tracking"],
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


@router.post("/save")
def save_weekly_fitness_progress(
    data: FitnessProgressRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        return save_fitness_progress(data, user_id)

    except HTTPException:
        raise

    except Exception as e:
        print("FITNESS PROGRESS SAVE ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest")
def latest_weekly_fitness_progress(
    user_id: str = Depends(get_current_user_id),
):
    try:
        return get_latest_fitness_progress(user_id)

    except HTTPException:
        raise

    except Exception as e:
        print("FITNESS PROGRESS LATEST ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
