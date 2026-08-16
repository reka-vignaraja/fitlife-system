from fastapi import APIRouter, HTTPException
from app.schemas.bmi_schema import BMIRequest
from app.services.bmi_service import generate_bmi_result


router = APIRouter(
    prefix="/api/bmi",
    tags=["BMI Calculator"],
)


@router.post("/calculate")
def calculate_bmi(data: BMIRequest):
    try:
        return generate_bmi_result(data)
    except Exception as e:
        print("BMI CALCULATION ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))