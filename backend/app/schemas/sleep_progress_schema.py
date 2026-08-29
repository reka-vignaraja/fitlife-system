from pydantic import BaseModel, Field
from typing import List, Optional, Literal


SleepQuality = Literal["poor", "average", "good", "excellent"]
MoodLevel = Literal["tired", "normal", "fresh"]
StressLevel = Literal["low", "moderate", "high"]
SleepinessLevel = Literal["low", "medium", "high"]


class DailySleepProgress(BaseModel):
    date: Optional[str] = ""
    day: str

    sleep_hours: float = Field(..., ge=0, le=24)
    sleep_quality: SleepQuality = "average"

    bedtime: Optional[str] = ""
    wake_time: Optional[str] = ""

    interruptions: int = Field(0, ge=0, le=20)
    stress_level: StressLevel = "moderate"
    mood: MoodLevel = "normal"

    # Professional tracking fields
    sleep_latency_minutes: Optional[int] = Field(0, ge=0, le=240)
    daytime_sleepiness: SleepinessLevel = "medium"

    screen_time_before_bed: Optional[str] = "no"
    caffeine_after_evening: Optional[str] = "no"
    late_heavy_meal: Optional[str] = "no"

    bedroom_dark: Optional[str] = "yes"
    bedroom_quiet: Optional[str] = "yes"
    bedroom_cool: Optional[str] = "yes"
    comfortable_bed: Optional[str] = "yes"


class SleepProgressRequest(BaseModel):
    week_start_date: Optional[str] = ""
    recommended_sleep_hours: float = Field(7.0, ge=5, le=10)
    previous_average_sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    weekly_feedback: Optional[str] = ""

    daily_sleep: List[DailySleepProgress] = Field(default_factory=list)


class SleepProgressResponse(BaseModel):
    message: str
    saved_to_database: bool
    progress_id: str

    average_sleep_hours: float
    sleep_debt_hours: float

    consistency_score: int
    bedtime_consistency_score: int
    wake_time_consistency_score: int
    routine_status: str
    irregular_bedtime_days: int

    good_sleep_days: int
    poor_sleep_days: int
    interrupted_days: int

    improvement_status: str
    target_gap_message: str
    weekly_insight_explanation: str
    next_week_goal: str
    next_week_recommendation: str