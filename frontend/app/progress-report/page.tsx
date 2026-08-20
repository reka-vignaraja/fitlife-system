"use client";

import { useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

type ProfileData = {
  full_name?: string;
  email?: string;
  height_cm?: number | string;
  weight_kg?: number | string;
  activity_level?: string;
  fitness_goal?: string;
  fitness_level?: string;
  workout_days?: string | number;
  diet_preference?: string;
  health_conditions?: string;
};

type ProgressSummary = {
  bmi_value: number | string;
  bmi_category: string;
  health_risk: string;
  nutrition_score: number | string;
  sleep_score: number | string;
  goal_progress: number;
  diet_recommendation?: string;
  diet_confidence?: number | null;
  diet_model_accuracy?: number | null;
  overall_score: number;
};

type FitnessSummary = {
  fitness_goal: string;
  fitness_level: string;
  workout_days: string | number;
  activity_level?: string;
};

type DietSummary = {
  diet_recommendation?: string;
  confidence?: number | null;
  model_accuracy?: number | null;
  algorithm_type?: string;
  daily_calorie_target?: number | string;
  diet_type?: string;
  meals_per_day?: number | string;
  created_at?: string | null;
};

type GoalSummary = {
  title?: string;
  category?: string;
  target_value?: number | string;
  current_value?: number | string;
  unit?: string;
  deadline?: string;
  priority?: string;
};

type SleepProgressDailyItem = {
  date?: string;
  day?: string;
  sleep_hours?: number | string;
  sleep_quality?: string;
  bedtime?: string;
  wake_time?: string;
  interruptions?: number | string;
  stress_level?: string;
  mood?: string;
};

type SleepProgressSummary = {
  has_weekly_progress: boolean;
  week_start_date: string;
  average_sleep_hours: number | string;
  sleep_debt_hours: number | string;
  consistency_score: number | string;
  good_sleep_days: number | string;
  poor_sleep_days: number | string;
  interrupted_days: number | string;
  improvement_status: string;
  next_week_goal: string;
  next_week_recommendation: string;
  weekly_feedback?: string;
  daily_sleep?: SleepProgressDailyItem[];
  created_at?: string | null;
};

type ProgressReportResponse = {
  message: string;
  generated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    email_verified: boolean;
  };
  profile?: ProfileData;
  summary: ProgressSummary;
  fitness: FitnessSummary;
  diet?: DietSummary;
  sleep_progress?: SleepProgressSummary;
  goal?: GoalSummary;
  recommendations: string[];
};

export default function ProgressReportPage() {
  const [report, setReport] = useState<ProgressReportResponse | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    full_name: "FitLife User",
    email: "",
    height_cm: "",
    weight_kg: "",
    activity_level: "Not set",
    fitness_goal: "Not set",
    fitness_level: "Not set",
    workout_days: "Not set",
    diet_preference: "Not set",
    health_conditions: "None",
  });

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProgressReport();
  }, []);

  async function fetchProgressReport() {
    try {
      setLoading(true);
      setGenerating(true);
      setError("");

      const progressData: ProgressReportResponse = await apiRequest(
        "/api/progress-report/summary",
        {
          method: "GET",
        }
      );

      setReport(progressData);

      setProfile((prev) => ({
        ...prev,
        full_name: progressData.user?.name || prev.full_name,
        email: progressData.user?.email || prev.email,
        height_cm: progressData.profile?.height_cm || prev.height_cm,
        weight_kg: progressData.profile?.weight_kg || prev.weight_kg,
        activity_level:
          progressData.profile?.activity_level ||
          progressData.fitness?.activity_level ||
          prev.activity_level,
        fitness_goal:
          progressData.profile?.fitness_goal ||
          progressData.fitness?.fitness_goal ||
          prev.fitness_goal,
        fitness_level:
          progressData.profile?.fitness_level ||
          progressData.fitness?.fitness_level ||
          prev.fitness_level,
        workout_days:
          progressData.profile?.workout_days ||
          progressData.fitness?.workout_days ||
          prev.workout_days,
        diet_preference:
          progressData.profile?.diet_preference ||
          progressData.diet?.diet_type ||
          prev.diet_preference,
        health_conditions:
          progressData.profile?.health_conditions || prev.health_conditions,
      }));

      try {
        const profileData = await apiRequest("/api/profile/me", {
          method: "GET",
        });

        setProfile((prev) => ({
          ...prev,
          ...profileData.profile,
          activity_level:
            profileData.profile?.activity_level ||
            progressData.profile?.activity_level ||
            progressData.fitness?.activity_level ||
            prev.activity_level,
          fitness_goal:
            profileData.profile?.fitness_goal ||
            progressData.fitness?.fitness_goal ||
            prev.fitness_goal,
          fitness_level:
            profileData.profile?.fitness_level ||
            progressData.fitness?.fitness_level ||
            prev.fitness_level,
          workout_days:
            profileData.profile?.workout_days ||
            progressData.fitness?.workout_days ||
            prev.workout_days,
          diet_preference:
            profileData.profile?.diet_preference ||
            progressData.diet?.diet_type ||
            prev.diet_preference,
          health_conditions:
            profileData.profile?.health_conditions ||
            progressData.profile?.health_conditions ||
            prev.health_conditions,
        }));
      } catch {
        // Progress report already includes enough profile data.
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load progress report."
      );
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }

  function downloadReport() {
    window.print();
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="progressReportPage">
          <div className="progressReportShell">
            <section className="progressHero">
              <span className="progressBadge">Progress Report</span>

              <h1 className="progressTitle">Loading your progress report...</h1>

              <p className="progressHeroText">
                Please wait while FitLife collects your BMI, health risk,
                nutrition, diet, sleep, goal, and fitness details.
              </p>
            </section>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (error || !report) {
    return (
      <ProtectedRoute>
        <main className="progressReportPage">
          <div className="progressReportShell">
            <section className="progressHero progressErrorHero">
              <span className="progressBadge progressErrorBadge">
                Progress Report Error
              </span>

              <h1 className="progressTitle">Unable to load report</h1>

              <p className="progressHeroText">
                {error || "Progress report data not found."}
              </p>

              <button
                type="button"
                onClick={fetchProgressReport}
                className="progressPrimaryButton"
              >
                Try Again
              </button>
            </section>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  const summary = report.summary;
  const fitness = report.fitness;
  const diet = report.diet;
  const sleepProgress = report.sleep_progress;
  const goal = report.goal;

  const dietRecommendation =
    diet?.diet_recommendation ||
    summary.diet_recommendation ||
    "Not generated";

  const dietConfidence =
    diet?.confidence ?? summary.diet_confidence ?? null;

  const dietModelAccuracy =
    diet?.model_accuracy ?? summary.diet_model_accuracy ?? null;

  return (
    <ProtectedRoute>
      <main className="progressReportPage">
        <div className="progressReportShell">
          <section className="progressHero">
            <span className="progressBadge">Progress Report</span>

            <div className="progressHeroGrid">
              <div>
                <h1 className="progressTitle">
                  Your Health & Fitness{" "}
                  <span>Progress Summary</span>
                </h1>

                <p className="progressHeroText">
                  This report summarizes BMI, health risk, nutrition, diet
                  recommendation, sleep, fitness goal, goal progress, and
                  overall progress using real backend data.
                </p>

                <div className="progressTags">
                  <Tag label={report.user.name || "FitLife User"} />
                  <Tag label={safeText(fitness.fitness_goal, "Goal not set")} />
                  <Tag
                    label={safeText(
                      profile.activity_level || fitness.activity_level,
                      "Activity not set"
                    )}
                  />
                  <Tag label={`Generated: ${formatDate(report.generated_at)}`} />
                </div>

                <div className="progressActions no-print">
                  <button
                    type="button"
                    onClick={fetchProgressReport}
                    disabled={generating}
                    className="progressPrimaryButton"
                  >
                    {generating ? "Generating..." : "Generate Latest Report"}
                  </button>

                  <button
                    type="button"
                    onClick={downloadReport}
                    className="progressSecondaryButton"
                  >
                    Download / Print Report
                  </button>
                </div>
              </div>

              <div className="progressOverallCard">
                <p>Overall Progress</p>
                <h2>{summary.overall_score}%</h2>
                <span>
                  Based on BMI, risk, nutrition, diet, sleep, and goals.
                </span>
              </div>
            </div>
          </section>

          <section className="progressMetricGrid">
            <ReportCard
              title="BMI Status"
              value={String(summary.bmi_value)}
              note={summary.bmi_category}
            />

            <ReportCard
              title="Health Risk"
              value={summary.health_risk}
              note="Risk summary"
            />

            <ReportCard
              title="Nutrition Score"
              value={String(summary.nutrition_score)}
              note="Nutrition summary"
            />

            <ReportCard
              title="Diet Plan"
              value={dietRecommendation}
              note="AI diet recommendation"
            />

            <ReportCard
              title="Sleep Score"
              value={String(summary.sleep_score)}
              note="Daily sleep summary"
            />

            <ReportCard
              title="Weekly Sleep"
              value={
                sleepProgress?.has_weekly_progress
                  ? formatSleepDurationForUser(
                      sleepProgress.average_sleep_hours
                    )
                  : "Not saved"
              }
              note={
                sleepProgress?.has_weekly_progress
                  ? sleepProgress.improvement_status
                  : "Weekly progress"
              }
            />
          </section>

          <section className="progressMainGrid">
            <div className="progressLeftColumn">
              <Panel title="Body & Health Analysis">
                <div className="progressInfoGrid">
                  <InfoBox
                    label="Height"
                    value={
                      profile.height_cm
                        ? `${profile.height_cm} cm`
                        : "Not set"
                    }
                  />

                  <InfoBox
                    label="Weight"
                    value={
                      profile.weight_kg
                        ? `${profile.weight_kg} kg`
                        : "Not set"
                    }
                  />

                  <InfoBox
                    label="BMI Value"
                    value={String(summary.bmi_value)}
                  />

                  <InfoBox
                    label="BMI Category"
                    value={summary.bmi_category}
                  />

                  <InfoBox
                    label="Health Risk Level"
                    value={summary.health_risk}
                  />

                  <InfoBox
                    label="Health Conditions"
                    value={safeText(profile.health_conditions, "None")}
                  />
                </div>
              </Panel>

              <Panel title="Fitness Progress">
                <div className="progressInfoGrid">
                  <InfoBox
                    label="Fitness Goal"
                    value={safeText(fitness.fitness_goal, "Not set")}
                  />

                  <InfoBox
                    label="Fitness Level"
                    value={safeText(fitness.fitness_level, "Not set")}
                  />

                  <InfoBox
                    label="Workout Days"
                    value={String(fitness.workout_days || "Not set")}
                  />

                  <InfoBox
                    label="Activity Level"
                    value={safeText(
                      profile.activity_level || fitness.activity_level,
                      "Not set"
                    )}
                  />
                </div>

                <div className="progressGoalCard">
                  <div className="progressGoalTop">
                    <span>Goal Progress</span>
                    <strong>{summary.goal_progress}%</strong>
                  </div>

                  <div className="progressGoalTrack">
                    <div
                      className="progressGoalFill"
                      style={{
                        width: `${Math.min(
                          Math.max(Number(summary.goal_progress) || 0, 0),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </Panel>

              <Panel title="Diet Recommendation">
                <div className="progressInfoGrid">
                  <InfoBox
                    label="AI Diet Recommendation"
                    value={dietRecommendation}
                  />

                  <InfoBox
                    label="Diet Confidence"
                    value={
                      dietConfidence !== null
                        ? `${dietConfidence}%`
                        : "Not available"
                    }
                  />

                  <InfoBox
                    label="Model Accuracy"
                    value={
                      dietModelAccuracy !== null
                        ? `${dietModelAccuracy}%`
                        : "Not available"
                    }
                  />

                  <InfoBox
                    label="Algorithm"
                    value={safeText(diet?.algorithm_type, "Not available")}
                  />

                  <InfoBox
                    label="Daily Calorie Target"
                    value={
                      diet?.daily_calorie_target
                        ? `${diet.daily_calorie_target} kcal`
                        : "Not set"
                    }
                  />

                  <InfoBox
                    label="Meals Per Day"
                    value={String(diet?.meals_per_day || "Not set")}
                  />

                  <InfoBox
                    label="Diet Type"
                    value={safeText(
                      diet?.diet_type || profile.diet_preference,
                      "Not set"
                    )}
                  />

                  <InfoBox
                    label="Diet Generated At"
                    value={formatDate(diet?.created_at || "")}
                  />
                </div>
              </Panel>

              <Panel title="Goal Details">
                <div className="progressInfoGrid">
                  <InfoBox
                    label="Goal Title"
                    value={safeText(goal?.title, "Not set")}
                  />

                  <InfoBox
                    label="Goal Category"
                    value={safeText(goal?.category, "Not set")}
                  />

                  <InfoBox
                    label="Current Value"
                    value={
                      goal?.current_value && goal?.unit
                        ? `${goal.current_value} ${goal.unit}`
                        : String(goal?.current_value || "Not set")
                    }
                  />

                  <InfoBox
                    label="Target Value"
                    value={
                      goal?.target_value && goal?.unit
                        ? `${goal.target_value} ${goal.unit}`
                        : String(goal?.target_value || "Not set")
                    }
                  />

                  <InfoBox
                    label="Deadline"
                    value={safeText(goal?.deadline, "Not set")}
                  />

                  <InfoBox
                    label="Priority"
                    value={safeText(goal?.priority, "Not set")}
                  />
                </div>
              </Panel>

              <Panel title="Sleep Progress Summary">
                {!sleepProgress?.has_weekly_progress ? (
                  <p className="progressEmptyText">
                    Weekly sleep progress is not saved yet. Save weekly sleep
                    progress from the Sleep Tracking page to show average sleep,
                    sleep debt, consistency score, good days, poor days, and next
                    week goal here.
                  </p>
                ) : (
                  <>
                    <div className="progressInfoGrid">
                      <InfoBox
                        label="Week Start Date"
                        value={safeText(
                          sleepProgress.week_start_date,
                          "Not saved"
                        )}
                      />

                      <InfoBox
                        label="Average Sleep"
                        value={formatSleepDurationForUser(
                          sleepProgress.average_sleep_hours
                        )}
                      />

                      <InfoBox
                        label="Sleep Debt"
                        value={formatSleepDurationForUser(
                          sleepProgress.sleep_debt_hours
                        )}
                      />

                      <InfoBox
                        label="Consistency Score"
                        value={`${sleepProgress.consistency_score}%`}
                      />

                      <InfoBox
                        label="Good Sleep Days"
                        value={String(sleepProgress.good_sleep_days)}
                      />

                      <InfoBox
                        label="Poor Sleep Days"
                        value={String(sleepProgress.poor_sleep_days)}
                      />

                      <InfoBox
                        label="Interrupted Days"
                        value={String(sleepProgress.interrupted_days)}
                      />

                      <InfoBox
                        label="Improvement Status"
                        value={safeText(
                          sleepProgress.improvement_status,
                          "Not saved"
                        )}
                      />
                    </div>

                    <div className="progressNextGoalCard">
                      <p>Next Week Goal</p>

                      <h3>{sleepProgress.next_week_goal}</h3>

                      <span>{sleepProgress.next_week_recommendation}</span>
                    </div>

                    {sleepProgress.daily_sleep &&
                      sleepProgress.daily_sleep.length > 0 && (
                        <div className="progressSleepDayGrid">
                          {sleepProgress.daily_sleep.map((item, index) => (
                            <div
                              key={`${item.date || item.day}-${index}`}
                              className="progressSleepDayCard"
                            >
                              <p>{safeText(item.date || item.day, "Sleep day")}</p>

                              <h3>
                                {formatSleepDurationForUser(
                                  item.sleep_hours || 0
                                ) || "Not recorded"}
                              </h3>

                              <span>
                                {safeText(item.bedtime, "-")} to{" "}
                                {safeText(item.wake_time, "-")} ·{" "}
                                {safeText(item.sleep_quality, "average")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </>
                )}
              </Panel>

              <Panel title="Nutrition & Lifestyle">
                <div className="progressInfoGrid">
                  <InfoBox
                    label="Diet Preference"
                    value={safeText(
                      diet?.diet_type || profile.diet_preference,
                      "Not set"
                    )}
                  />

                  <InfoBox
                    label="Nutrition Score"
                    value={String(summary.nutrition_score)}
                  />

                  <InfoBox
                    label="Sleep Score"
                    value={String(summary.sleep_score)}
                  />

                  <InfoBox
                    label="Overall Score"
                    value={`${summary.overall_score}%`}
                  />
                </div>
              </Panel>
            </div>

            <aside className="progressAside">
              <Panel title="Final Recommendation">
                {report.recommendations.length === 0 ? (
                  <p className="progressEmptyText">
                    No recommendations available.
                  </p>
                ) : (
                  <ul className="progressRecommendationList">
                    {report.recommendations.map((item) => (
                      <li key={item}>✓ {item}</li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Report Status">
                <StatusRow
                  label="Profile Data"
                  value={
                    profile.height_cm && profile.weight_kg
                      ? "Available"
                      : "Incomplete"
                  }
                />

                <StatusRow
                  label="BMI Analysis"
                  value={
                    summary.bmi_value === "Not set" ? "Pending" : "Completed"
                  }
                />

                <StatusRow
                  label="Health Risk"
                  value={
                    summary.health_risk === "Not calculated"
                      ? "Pending"
                      : "Completed"
                  }
                />

                <StatusRow
                  label="Nutrition"
                  value={
                    summary.nutrition_score === "Moderate"
                      ? "Generated"
                      : "Completed"
                  }
                />

                <StatusRow
                  label="Diet Recommendation"
                  value={
                    dietRecommendation === "Not generated"
                      ? "Pending"
                      : "Completed"
                  }
                />

                <StatusRow
                  label="Sleep"
                  value={
                    summary.sleep_score === "Moderate"
                      ? "Generated"
                      : "Completed"
                  }
                />

                <StatusRow
                  label="Weekly Sleep Progress"
                  value={
                    sleepProgress?.has_weekly_progress
                      ? "Completed"
                      : "Pending"
                  }
                />

                <StatusRow
                  label="Goal Progress"
                  value={
                    summary.goal_progress > 0 ? "In Progress" : "Not Started"
                  }
                />

                <StatusRow label="Progress Report" value="Generated" />
              </Panel>
            </aside>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function safeText(value?: string | number | null, fallback = "Not set") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function formatDate(dateValue: string) {
  if (!dateValue) return "Not available";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString();
}

function formatSleepDurationForUser(hoursValue: string | number) {
  const totalHours = Number(hoursValue);

  if (!totalHours || Number.isNaN(totalHours)) {
    return "Not recorded";
  }

  let hours = Math.floor(totalHours);
  let minutes = Math.round((totalHours - hours) * 60);

  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function Tag({ label }: { label: string }) {
  return <span className="progressTag">{label}</span>;
}

function ReportCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="progressReportCard">
      <p>{title}</p>
      <h3>{value}</h3>
      <span>{note}</span>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="progressPanel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="progressInfoBox">
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="progressStatusRow">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}