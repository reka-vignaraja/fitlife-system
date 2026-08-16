from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings
from app.schemas.diet_schema import DietPlanRequest
from app.services.diet_service import generate_ai_diet_plan


router = APIRouter(
    prefix="/api/diet",
    tags=["AI Diet Plan"],
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
def generate_diet_plan(
    data: DietPlanRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        return generate_ai_diet_plan(data, user_id=user_id)

    except HTTPException as e:
        raise e

    except Exception as e:
        print("DIET PLAN ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))