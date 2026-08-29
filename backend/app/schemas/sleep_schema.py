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

    # Professional sleep tracking fields
    sleep_latency_minutes: Optional[int] = Field(0, ge=0, le=240)
    daytime_sleepiness: Optional[str] = "medium"

    late_heavy_meal: Optional[str] = "no"
    exercise_today: Optional[str] = "no"

    bedroom_dark: Optional[str] = "yes"
    bedroom_quiet: Optional[str] = "yes"
    bedroom_cool: Optional[str] = "yes"
    comfortable_bed: Optional[str] = "yes"

    notes: Optional[str] = ""