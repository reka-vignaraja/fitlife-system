from pydantic import BaseModel, Field
from typing import List, Optional, Literal


ProgressStatus = Literal["completed", "skipped", "pending"]
DifficultyLevel = Literal["easy", "moderate", "hard", "not done"]
EnergyLevel = Literal["low", "normal", "high"]


class DailyWorkoutProgress(BaseModel):
    day: str
    status: ProgressStatus = "pending"
    duration_minutes: int = Field(0, ge=0, le=240)
    difficulty: DifficultyLevel = "not done"
    notes: Optional[str] = ""


class FitnessProgressRequest(BaseModel):
    plan_id: Optional[str] = ""
    week_start_date: Optional[str] = ""

    current_weight_kg: float = Field(..., gt=0)
    previous_weight_kg: Optional[float] = Field(None, gt=0)

    energy_level: EnergyLevel = "normal"
    overall_difficulty: DifficultyLevel = "moderate"
    feedback: Optional[str] = ""

    daily_progress: List[DailyWorkoutProgress] = Field(default_factory=list)


class FitnessProgressResponse(BaseModel):
    message: str
    saved_to_database: bool
    progress_id: str
    completion_percentage: int
    completed_days: int
    skipped_days: int
    pending_days: int
    next_week_adjustment: str
