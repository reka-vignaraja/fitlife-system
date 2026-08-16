from pydantic import BaseModel, Field
from typing import Optional


class SleepAnalysisRequest(BaseModel):
    age: int = Field(..., ge=10, le=100)
    gender: str

    sleep_hours: float = Field(..., ge=0, le=24)
    sleep_quality: str

    bedtime: str
    wake_time: str

    interruptions: int = Field(..., ge=0, le=20)
    screen_time_before_bed: str
    caffeine_after_evening: str
    stress_level: str

    notes: Optional[str] = ""