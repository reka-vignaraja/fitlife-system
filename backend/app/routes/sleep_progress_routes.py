from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings
from app.schemas.sleep_progress_schema import SleepProgressRequest
from app.services.sleep_progress_service import (
    save_sleep_progress,
    get_latest_sleep_progress,
)


router = APIRouter(
    prefix="/api/sleep-progress",
    tags=["Sleep Progress Tracking"],
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
def save_weekly_sleep_progress(
    data: SleepProgressRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        return save_sleep_progress(data, user_id)

    except HTTPException:
        raise

    except Exception as e:
        print("SLEEP PROGRESS SAVE ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest")
def get_latest_weekly_sleep_progress(
    user_id: str = Depends(get_current_user_id),
):
    try:
        return get_latest_sleep_progress(user_id)

    except HTTPException:
        raise

    except Exception as e:
        print("SLEEP PROGRESS LATEST ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
