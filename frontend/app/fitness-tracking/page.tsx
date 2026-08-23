"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

type WorkoutDay = {
  day: string;
  type: string;
  duration_minutes: number;
  intensity: string;
  warm_up: string;
  main_workout: string[];
  cool_down: string;
  note: string;
};

type FitnessResult = {
  _id?: string;
  bmi: number;
  bmi_category: string;
  goal: string;
  fitness_level: string;
  activity_level: string;
  equipment: string;
  workout_days_per_week: number;
  duration_minutes: number;
  recommended_intensity: string;
  estimated_calories_per_session: number;
  estimated_weekly_calories: number;
  weekly_plan: WorkoutDay[];
  recommendations: string[];
  disclaimer: string;
};

type ProgressStatus = "completed" | "skipped" | "pending";
type DifficultyLevel = "easy" | "moderate" | "hard" | "not done";
type EnergyLevel = "low" | "normal" | "high";

type DailyProgress = {
  day: string;
  status: ProgressStatus;
  duration_minutes: string;
  difficulty: DifficultyLevel;
};

type LatestProgress = {
  _id: string;
  week_start_date: string;
  current_weight_kg: number;
  previous_weight_kg?: number;
  completed_days: number;
  skipped_days: number;
  pending_days: number;
  completion_percentage: number;
  energy_level: EnergyLevel;
  overall_difficulty: DifficultyLevel;
  feedback: string;
  next_week_adjustment: string;
  daily_progress: {
    day: string;
    status: ProgressStatus;
    duration_minutes: number;
    difficulty: DifficultyLevel;
    notes: string;
  }[];
  created_at: string;
};

const workoutSlots = [
  "Workout 1",
  "Workout 2",
  "Workout 3",
  "Workout 4",
  "Workout 5",
  "Workout 6",
];

function getPlannedWorkoutDays(value?: string | number) {
  const count = Number(value || 4);

  if (!Number.isFinite(count)) return 4;

  return Math.max(1, Math.min(6, Math.floor(count)));
}

function createPlannedDailyProgress(dayCount: number): DailyProgress[] {
  return workoutSlots.slice(0, dayCount).map((day) => ({
    day,
    status: "pending",
    duration_minutes: "",
    difficulty: "not done",
  }));
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentWeekStartDate() {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return formatDateInput(monday);
}

function normalizeDateInput(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function convertLatestDailyProgress(
  savedProgress: LatestProgress["daily_progress"] | undefined,
  plannedDays: number
): DailyProgress[] {
  if (!savedProgress || savedProgress.length === 0) {
    return createPlannedDailyProgress(plannedDays);
  }

  const normalized = savedProgress.slice(0, plannedDays);

  return workoutSlots.slice(0, plannedDays).map((day, index) => {
    const savedDay = normalized[index];

    if (!savedDay) {
      return {
        day,
        status: "pending",
        duration_minutes: "",
        difficulty: "not done",
      };
    }

    return {
      day,
      status: savedDay.status,
      duration_minutes:
        savedDay.duration_minutes > 0 ? String(savedDay.duration_minutes) : "",
      difficulty: savedDay.difficulty,
    };
  });
}

function getProgressStats(dailyProgress: DailyProgress[]) {
  const total_days = dailyProgress.length || 1;

  const completed_days = dailyProgress.filter(
    (item) => item.status === "completed"
  ).length;

  const skipped_days = dailyProgress.filter(
    (item) => item.status === "skipped"
  ).length;

  const pending_days = dailyProgress.filter(
    (item) => item.status === "pending"
  ).length;

  const completion_percentage = Math.round((completed_days / total_days) * 100);

  return {
    total_days,
    completed_days,
    skipped_days,
    pending_days,
    completion_percentage,
  };
}

function isRecoveryDay(day: WorkoutDay) {
  const text = `${day.type} ${day.note} ${day.warm_up} ${day.cool_down}`.toLowerCase();

  return (
    text.includes("rest") ||
    text.includes("recovery") ||
    text.includes("stretch") ||
    text.includes("mobility")
  );
}

function getActualWorkoutPlan(result: FitnessResult | null) {
  if (!result) return [];

  const plannedDays = getPlannedWorkoutDays(result.workout_days_per_week);
  const workoutOnlyDays = result.weekly_plan.filter((day) => !isRecoveryDay(day));

  if (workoutOnlyDays.length > 0) {
    return workoutOnlyDays.slice(0, plannedDays);
  }

  return result.weekly_plan.slice(0, plannedDays);
}

function getNextPendingIndex(dailyProgress: DailyProgress[]) {
  return dailyProgress.findIndex((item) => item.status === "pending");
}

function statusLabel(status: ProgressStatus) {
  if (status === "completed") return "Completed";
  if (status === "skipped") return "Skipped";
  return "Pending";
}

export default function FitnessTrackingPage() {
  const [formData, setFormData] = useState({
    age: "25",
    gender: "male",
    height_cm: "170",
    weight_kg: "75",

    fitness_level: "beginner",
    activity_level: "moderate",
    goal: "weight loss",
    workout_days_per_week: "4",
    duration_minutes: "45",
    equipment: "no equipment",
    preferred_workouts: "",
    injuries: "",
    health_conditions: "",
    notes: "",
  });

  const [progressData, setProgressData] = useState({
    week_start_date: getCurrentWeekStartDate(),
    current_weight_kg: "",
    previous_weight_kg: "",
    energy_level: "normal" as EnergyLevel,
    overall_difficulty: "moderate" as DifficultyLevel,
    feedback: "",
    daily_progress: createPlannedDailyProgress(4),
  });

  const [result, setResult] = useState<FitnessResult | null>(null);
  const [latestProgress, setLatestProgress] = useState<LatestProgress | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [progressSaving, setProgressSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");
  const [progressError, setProgressError] = useState("");

  const plannedWorkoutDays = getPlannedWorkoutDays(
    result?.workout_days_per_week || formData.workout_days_per_week
  );

  const progressStats = useMemo(
    () => getProgressStats(progressData.daily_progress),
    [progressData.daily_progress]
  );

  const actualWorkoutPlan = useMemo(
    () => getActualWorkoutPlan(result),
    [result]
  );

  const nextPendingIndex = getNextPendingIndex(progressData.daily_progress);

  const latestWeekStart = normalizeDateInput(latestProgress?.week_start_date);
  const currentWeekStart = getCurrentWeekStartDate();
  const latestIsCurrentWeek = latestWeekStart === currentWeekStart;

  useEffect(() => {
    initialiseFitnessPage();
  }, []);

  async function initialiseFitnessPage() {
    setInitialLoading(true);

    try {
      await fetchLatestFitnessPlan();
      await fetchLatestFitnessProgress();
    } finally {
      setInitialLoading(false);
    }
  }

  async function fetchLatestFitnessPlan() {
    try {
      const data = await apiRequest("/api/fitness/latest-plan", {
        method: "GET",
      });

      if (data.has_plan && data.plan) {
        const latestPlan = data.plan as FitnessResult;

        setResult(latestPlan);

        const plannedDays = getPlannedWorkoutDays(
          latestPlan.workout_days_per_week
        );

        setFormData((prev) => ({
          ...prev,
          fitness_level: latestPlan.fitness_level || prev.fitness_level,
          activity_level: latestPlan.activity_level || prev.activity_level,
          goal: latestPlan.goal || prev.goal,
          workout_days_per_week: latestPlan.workout_days_per_week
            ? String(latestPlan.workout_days_per_week)
            : prev.workout_days_per_week,
          duration_minutes: latestPlan.duration_minutes
            ? String(latestPlan.duration_minutes)
            : prev.duration_minutes,
          equipment: latestPlan.equipment || prev.equipment,
        }));

        setProgressData((prev) => ({
          ...prev,
          daily_progress:
            prev.daily_progress.length > 0
              ? prev.daily_progress
              : createPlannedDailyProgress(plannedDays),
        }));
      }
    } catch (err) {
      setResult(null);
    }
  }

  async function fetchLatestFitnessProgress() {
    try {
      const data = await apiRequest("/api/fitness-progress/latest", {
        method: "GET",
      });

      if (data.has_progress && data.progress) {
        const progress = data.progress as LatestProgress;
        setLatestProgress(progress);

        const savedWeekStart = normalizeDateInput(progress.week_start_date);
        const currentWeekStartDate = getCurrentWeekStartDate();

        const savedDaysCount =
          progress.daily_progress && progress.daily_progress.length > 0
            ? progress.daily_progress.length
            : getPlannedWorkoutDays(formData.workout_days_per_week);

        setProgressData((prev) => {
          const isSameWeek = savedWeekStart === currentWeekStartDate;

          if (isSameWeek) {
            return {
              ...prev,
              week_start_date: currentWeekStartDate,
              current_weight_kg: progress.current_weight_kg
                ? String(progress.current_weight_kg)
                : prev.current_weight_kg,
              previous_weight_kg: progress.previous_weight_kg
                ? String(progress.previous_weight_kg)
                : prev.previous_weight_kg,
              energy_level: progress.energy_level || prev.energy_level,
              overall_difficulty:
                progress.overall_difficulty || prev.overall_difficulty,
              feedback: progress.feedback || "",
              daily_progress: convertLatestDailyProgress(
                progress.daily_progress,
                savedDaysCount
              ),
            };
          }

          return {
            ...prev,
            week_start_date: currentWeekStartDate,
            previous_weight_kg: progress.current_weight_kg
              ? String(progress.current_weight_kg)
              : prev.previous_weight_kg,
            feedback: "",
            daily_progress: createPlannedDailyProgress(
              getPlannedWorkoutDays(formData.workout_days_per_week)
            ),
          };
        });
      }
    } catch (err) {
      setLatestProgress(null);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "workout_days_per_week") {
      const plannedDays = getPlannedWorkoutDays(value);

      setProgressData((prev) => ({
        ...prev,
        daily_progress: createPlannedDailyProgress(plannedDays),
      }));
    }
  };

  const handleProgressChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setProgressData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const markWorkoutStatus = (
    workoutIndex: number,
    status: ProgressStatus
  ) => {
    setProgressData((prev) => {
      const updatedDays = [...prev.daily_progress];

      if (!updatedDays[workoutIndex]) {
        return prev;
      }

      updatedDays[workoutIndex] = {
        ...updatedDays[workoutIndex],
        status,
        duration_minutes:
          status === "completed" ? formData.duration_minutes || "45" : "",
        difficulty:
          status === "completed"
            ? prev.overall_difficulty === "not done"
              ? "moderate"
              : prev.overall_difficulty
            : "not done",
      };

      return {
        ...prev,
        daily_progress: updatedDays,
      };
    });

    if (status === "completed") {
      setProgressMessage(
        `Workout ${workoutIndex + 1} marked as completed. Save weekly progress to store it.`
      );
    }

    if (status === "skipped") {
      setProgressMessage(
        `Workout ${workoutIndex + 1} marked as skipped. Save weekly progress to store it.`
      );
    }
  };

  const generateFitnessPlan = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setResult(null);
    setProgressMessage("");
    setProgressError("");

    if (
      !formData.fitness_level ||
      !formData.goal ||
      !formData.workout_days_per_week ||
      !formData.duration_minutes
    ) {
      setError("Please select fitness level, goal, workout days, and duration.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest("/api/fitness/generate", {
        method: "POST",
        body: JSON.stringify({
          age: Number(formData.age || 25),
          gender: formData.gender || "male",
          height_cm: Number(formData.height_cm || 170),
          weight_kg: Number(formData.weight_kg || 75),
          fitness_level: formData.fitness_level,
          activity_level: formData.activity_level,
          goal: formData.goal,
          workout_days_per_week: Number(formData.workout_days_per_week),
          duration_minutes: Number(formData.duration_minutes),
          equipment: formData.equipment,
          preferred_workouts: formData.preferred_workouts,
          injuries: formData.injuries,
          health_conditions: formData.health_conditions,
          notes: formData.notes,
        }),
      });

      setResult(data);

      const plannedDays = getPlannedWorkoutDays(data.workout_days_per_week);
      const savedWeekStart = normalizeDateInput(latestProgress?.week_start_date);
      const currentWeekStartDate = getCurrentWeekStartDate();

      setProgressData((prev) => {
        if (
          latestProgress &&
          savedWeekStart === currentWeekStartDate &&
          latestProgress.daily_progress &&
          latestProgress.daily_progress.length > 0
        ) {
          return {
            ...prev,
            week_start_date: currentWeekStartDate,
            daily_progress: convertLatestDailyProgress(
              latestProgress.daily_progress,
              plannedDays
            ),
          };
        }

        return {
          ...prev,
          week_start_date: currentWeekStartDate,
          daily_progress: createPlannedDailyProgress(plannedDays),
        };
      });

      setProgressMessage("AI fitness plan generated. Workout plan is ready.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate fitness plan."
      );
    } finally {
      setLoading(false);
    }
  };

  const saveWeeklyProgress = async (e: FormEvent) => {
    e.preventDefault();

    setProgressError("");
    setProgressMessage("");

    try {
      setProgressSaving(true);

      const dailyProgressPayload = progressData.daily_progress.map((item) => ({
        day: item.day,
        status: item.status,
        duration_minutes: item.duration_minutes
          ? Number(item.duration_minutes)
          : 0,
        difficulty: item.difficulty,
        notes: "",
      }));

      const hiddenCurrentWeight = Number(
        progressData.current_weight_kg || formData.weight_kg || 75
      );

      const hiddenPreviousWeight = Number(
        progressData.previous_weight_kg || formData.weight_kg || 75
      );

      const data = await apiRequest("/api/fitness-progress/save", {
        method: "POST",
        body: JSON.stringify({
          plan_id: result?._id || "",
          week_start_date:
            progressData.week_start_date || getCurrentWeekStartDate(),
          current_weight_kg: hiddenCurrentWeight,
          previous_weight_kg: hiddenPreviousWeight,
          energy_level: progressData.energy_level,
          overall_difficulty: progressData.overall_difficulty,
          feedback: progressData.feedback,
          daily_progress: dailyProgressPayload,
        }),
      });

      setProgressMessage(
        `${data.message}. Completion: ${data.completion_percentage}%.`
      );

      await fetchLatestFitnessProgress();
    } catch (err) {
      setProgressError(
        err instanceof Error
          ? err.message
          : "Failed to save weekly fitness progress."
      );
    } finally {
      setProgressSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="fitnessPage fitnessRedesignPage">
        <section className="fitnessHero">
          <div className="container">
            <span className="badge">AI Fitness Guider</span>

            <h1>Personalized AI Fitness Plan</h1>

            <p>
              Generate a clean workout plan, complete each workout, and track
              weekly progress using only your planned workout days.
            </p>
          </div>
        </section>

        <section className="fitnessSection">
          <div className="container fitnessShell">
            {initialLoading && (
              <div className="fitnessInfoBox">
                <p>Loading your latest fitness plan and progress...</p>
              </div>
            )}

            <div className="fitnessTopGrid">
              <div className="fitnessFormCard">
                <div className="fitnessCardHeader">
                  <span className="fitnessMiniLabel">Step 1</span>

                  <h2>Build Your Plan</h2>

                  <p>
                    Choose your fitness preferences. The system will generate
                    only the selected number of workout days.
                  </p>
                </div>

                {error && <div className="errorMessage">{error}</div>}

                <form onSubmit={generateFitnessPlan} className="fitnessForm">
                  <div className="fitnessFormGrid">
                    <div className="fitnessFormGroup">
                      <label>Fitness Level</label>

                      <select
                        name="fitness_level"
                        value={formData.fitness_level}
                        onChange={handleChange}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div className="fitnessFormGroup">
                      <label>Activity Level</label>

                      <select
                        name="activity_level"
                        value={formData.activity_level}
                        onChange={handleChange}
                      >
                        <option value="sedentary">Sedentary</option>
                        <option value="light">Light</option>
                        <option value="moderate">Moderate</option>
                        <option value="active">Active</option>
                        <option value="very active">Very Active</option>
                      </select>
                    </div>

                    <div className="fitnessFormGroup">
                      <label>Fitness Goal</label>

                      <select
                        name="goal"
                        value={formData.goal}
                        onChange={handleChange}
                      >
                        <option value="weight loss">Weight Loss</option>
                        <option value="muscle gain">Muscle Gain</option>
                        <option value="endurance">Endurance</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>

                    <div className="fitnessFormGroup">
                      <label>Equipment</label>

                      <select
                        name="equipment"
                        value={formData.equipment}
                        onChange={handleChange}
                      >
                        <option value="no equipment">No Equipment</option>
                        <option value="home">Home Equipment</option>
                        <option value="gym">Gym</option>
                      </select>
                    </div>

                    <div className="fitnessFormGroup">
                      <label>Workout Days / Week</label>

                      <select
                        name="workout_days_per_week"
                        value={formData.workout_days_per_week}
                        onChange={handleChange}
                      >
                        <option value="2">2 Days</option>
                        <option value="3">3 Days</option>
                        <option value="4">4 Days</option>
                        <option value="5">5 Days</option>
                        <option value="6">6 Days</option>
                      </select>
                    </div>

                    <div className="fitnessFormGroup">
                      <label>Duration</label>

                      <select
                        name="duration_minutes"
                        value={formData.duration_minutes}
                        onChange={handleChange}
                      >
                        <option value="20">20 Minutes</option>
                        <option value="30">30 Minutes</option>
                        <option value="45">45 Minutes</option>
                        <option value="60">60 Minutes</option>
                        <option value="90">90 Minutes</option>
                      </select>
                    </div>
                  </div>

                  <details className="fitnessAdvancedBox">
                    <summary>Advanced details</summary>

                    <div className="fitnessAdvancedGrid">
                      <div className="fitnessFormGroup">
                        <label>Preferred Workouts</label>

                        <input
                          type="text"
                          name="preferred_workouts"
                          placeholder="Example: walking, yoga, bodyweight"
                          value={formData.preferred_workouts}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="fitnessFormGroup">
                        <label>Injuries</label>

                        <input
                          type="text"
                          name="injuries"
                          placeholder="Example: knee pain, back pain"
                          value={formData.injuries}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="fitnessFormGroup">
                        <label>Health Conditions</label>

                        <input
                          type="text"
                          name="health_conditions"
                          placeholder="Example: asthma, pressure"
                          value={formData.health_conditions}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="fitnessFormGroup fitnessWideField">
                        <label>Extra Notes</label>

                        <textarea
                          name="notes"
                          placeholder="Example: I want a home workout plan"
                          value={formData.notes}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </details>

                  <button
                    type="submit"
                    className="fitnessSubmitBtn"
                    disabled={loading}
                  >
                    {loading
                      ? "Generating..."
                      : result
                      ? "Regenerate Workout Plan"
                      : "Generate Workout Plan"}
                  </button>
                </form>
              </div>

              <div className="fitnessResultCard">
                {!result ? (
                  <div className="fitnessPreviewState">
                    <span className="fitnessMiniLabel">Step 2</span>

                    <h2>Workout Plan Preview</h2>

                    <p>
                      After generation, your selected workout plan will appear
                      here with complete and skipped options.
                    </p>

                    <div className="fitnessPreviewList">
                      <div>
                        <strong>Selected plan only</strong>
                        <span>4 days selected means 4 workout cards only</span>
                      </div>

                      <div>
                        <strong>Workout status</strong>
                        <span>Mark each workout as completed or skipped</span>
                      </div>

                      <div>
                        <strong>Progress tracking</strong>
                        <span>Completion is based on planned workouts</span>
                      </div>
                    </div>

                    {latestProgress && (
                      <div className="fitnessInfoBox">
                        <h3>
                          {latestIsCurrentWeek
                            ? "This Week Saved Progress"
                            : "Previous Week Summary"}
                        </h3>

                        <p>
                          Completion:{" "}
                          <strong>
                            {latestProgress.completion_percentage}%
                          </strong>
                        </p>

                        <p>{latestProgress.next_week_adjustment}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="fitnessResultContent">
                    <div className="fitnessPlanTitleRow">
                      <div>
                        <span className="fitnessMiniLabel">Step 2</span>
                        <h2>Workout Plan</h2>
                      </div>

                      <span>{plannedWorkoutDays} workouts only</span>
                    </div>

                    <div className="fitnessSummaryGrid">
                      <div>
                        <span>Intensity</span>
                        <strong>{result.recommended_intensity}</strong>
                        <p>Recommended</p>
                      </div>

                      <div>
                        <span>Calories</span>
                        <strong>{result.estimated_calories_per_session}</strong>
                        <p>Per session</p>
                      </div>

                      <div>
                        <span>Weekly Burn</span>
                        <strong>{result.estimated_weekly_calories}</strong>
                        <p>Estimated kcal</p>
                      </div>

                      <div>
                        <span>Workouts</span>
                        <strong>{plannedWorkoutDays}</strong>
                        <p>Selected days</p>
                      </div>
                    </div>

                    <div className="fitnessScrollablePlan">
                      <div className="fitnessPlanAccordionList">
                        {actualWorkoutPlan.map((day, index) => {
                          const workoutStatus =
                            progressData.daily_progress[index]?.status ||
                            "pending";

                          return (
                            <details
                              className={`fitnessPlanAccordion ${workoutStatus}`}
                              key={`${day.day}-${index}`}
                              open={
                                index === nextPendingIndex ||
                                (nextPendingIndex === -1 && index === 0)
                              }
                            >
                              <summary>
                                <span>
                                  Workout {index + 1} - {day.type}
                                </span>

                                <strong>{day.duration_minutes} min</strong>
                              </summary>

                              <div className="fitnessPlanDetails">
                                <div>
                                  <b>Warm Up</b>
                                  <p>{day.warm_up}</p>
                                </div>

                                <div>
                                  <b>Main Workout</b>

                                  <ul>
                                    {day.main_workout.map((item) => (
                                      <li key={item}>{item}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <b>Cool Down</b>
                                  <p>{day.cool_down}</p>
                                </div>

                                <p className="fitnessPlanNote">{day.note}</p>

                                <div className="fitnessPlanStatusActions">
                                  <div
                                    className={`fitnessPlanStatusPill ${workoutStatus}`}
                                  >
                                    <span>Status</span>
                                    <strong>{statusLabel(workoutStatus)}</strong>
                                  </div>

                                  <div className="fitnessPlanActionButtons">
                                    <button
                                      type="button"
                                      className="fitnessSmallBtn"
                                      onClick={() =>
                                        markWorkoutStatus(index, "completed")
                                      }
                                    >
                                      Completed
                                    </button>

                                    <button
                                      type="button"
                                      className="fitnessGhostBtn"
                                      onClick={() =>
                                        markWorkoutStatus(index, "skipped")
                                      }
                                    >
                                      Skipped
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </details>
                          );
                        })}
                      </div>

                      <div className="fitnessRecoveryNote">
                        Recovery days are automatically considered between
                        workouts, but only planned workout days are shown here.
                      </div>

                      <div className="fitnessInfoBox">
                        <h3>Recommendations</h3>

                        <ul>
                          {result.recommendations.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>

                        <p>{result.disclaimer}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {result && (
              <div className="fitnessProgressCard">
                <div className="fitnessProgressHeader">
                  <div>
                    <span className="fitnessMiniLabel">Step 3</span>

                    <h2>Weekly Progress</h2>

                    <p>
                      Progress is calculated from your{" "}
                      <strong>{plannedWorkoutDays}</strong> planned workouts
                      only.
                    </p>
                  </div>

                  <div className="fitnessProgressScore">
                    <span>Current completion</span>
                    <strong>{progressStats.completion_percentage}%</strong>

                    <p>
                      {progressStats.completed_days} completed -{" "}
                      {progressStats.skipped_days} skipped -{" "}
                      {progressStats.pending_days} pending
                    </p>
                  </div>
                </div>

                {progressMessage && (
                  <div className="fitnessSuccessBox">
                    <p>{progressMessage}</p>
                  </div>
                )}

                {progressError && (
                  <div className="errorMessage">{progressError}</div>
                )}

                <form
                  className="fitnessProgressForm"
                  onSubmit={saveWeeklyProgress}
                >
                  <div className="fitnessProgressMetaGrid">
                    <div className="fitnessFormGroup">
                      <label>Week Start Date</label>

                      <input
                        type="date"
                        name="week_start_date"
                        value={progressData.week_start_date}
                        onChange={handleProgressChange}
                      />
                    </div>

                    <div className="fitnessFormGroup">
                      <label>Energy Level</label>

                      <select
                        name="energy_level"
                        value={progressData.energy_level}
                        onChange={handleProgressChange}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div className="fitnessFormGroup">
                      <label>Overall Difficulty</label>

                      <select
                        name="overall_difficulty"
                        value={progressData.overall_difficulty}
                        onChange={handleProgressChange}
                      >
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="hard">Hard</option>
                        <option value="not done">Not Done</option>
                      </select>
                    </div>
                  </div>

                  <div className="fitnessCompactWeeklyUpdate">
                    <div className="fitnessCompactUpdateHeader">
                      <h3>Workout Completion</h3>

                      <p>
                        Mark each workout as Completed or Skipped from the
                        workout plan cards above. The weekly summary updates
                        automatically.
                      </p>
                    </div>

                    <div className="fitnessCompactGrid">
                      <div className="fitnessMiniStat">
                        <span>Completed</span>
                        <strong>{progressStats.completed_days}</strong>
                      </div>

                      <div className="fitnessMiniStat">
                        <span>Skipped</span>
                        <strong>{progressStats.skipped_days}</strong>
                      </div>

                      <div className="fitnessMiniStat">
                        <span>Pending</span>
                        <strong>{progressStats.pending_days}</strong>
                      </div>

                      <div className="fitnessMiniStat">
                        <span>Completion</span>
                        <strong>{progressStats.completion_percentage}%</strong>
                      </div>
                    </div>

                    <div className="fitnessWorkoutStatusGrid">
                      {progressData.daily_progress.map((item, index) => (
                        <div
                          key={`${item.day}-${index}`}
                          className={`fitnessWorkoutStatus ${item.status}`}
                        >
                          <span>{item.day}</span>
                          <strong>{statusLabel(item.status)}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="fitnessCompactNote">
                      <strong>Summary:</strong>
                      <span>
                        {progressStats.completed_days} completed,{" "}
                        {progressStats.skipped_days} skipped,{" "}
                        {progressStats.pending_days} pending out of{" "}
                        {plannedWorkoutDays} workouts.
                      </span>
                    </div>
                  </div>

                  <div className="fitnessFormGroup fitnessWideField">
                    <label>Weekly Feedback</label>

                    <textarea
                      name="feedback"
                      placeholder="Example: I completed most workouts but one session was difficult."
                      value={progressData.feedback}
                      onChange={handleProgressChange}
                    />
                  </div>

                  <button
                    type="submit"
                    className="fitnessSubmitBtn"
                    disabled={progressSaving}
                  >
                    {progressSaving
                      ? "Saving Progress..."
                      : "Save Weekly Progress"}
                  </button>
                </form>
              </div>
            )}

            {latestProgress && (
              <div className="fitnessLatestCard">
                <div>
                  <span className="fitnessMiniLabel">
                    {latestIsCurrentWeek
                      ? "This Week Saved Progress"
                      : "Previous Week Improvement"}
                  </span>

                  <h2>Next Week Adjustment</h2>

                  <p>{latestProgress.next_week_adjustment}</p>
                </div>

                <div className="fitnessLatestStats">
                  <div>
                    <span>Completion</span>
                    <strong>{latestProgress.completion_percentage}%</strong>
                  </div>

                  <div>
                    <span>Completed</span>
                    <strong>{latestProgress.completed_days}</strong>
                  </div>

                  <div>
                    <span>Skipped</span>
                    <strong>{latestProgress.skipped_days}</strong>
                  </div>

                  <div>
                    <span>Pending</span>
                    <strong>{latestProgress.pending_days}</strong>
                  </div>
                </div>

                <div className="fitnessImprovementChart">
                  <span>Progress Visual</span>

                  <div>
                    <i
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, latestProgress.completion_percentage)
                        )}%`,
                      }}
                    />
                  </div>

                  <strong>{latestProgress.completion_percentage}%</strong>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}