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
        <main className="min-h-screen bg-black px-4 py-10 text-white">
          <div className="mx-auto max-w-7xl">
            <section className="rounded-[34px] border border-orange-500/30 bg-[#111111] p-8 shadow-2xl">
              <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400">
                Progress Report
              </span>

              <h1 className="mt-6 text-4xl font-extrabold text-white">
                Loading your progress report...
              </h1>

              <p className="mt-4 text-slate-300">
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
        <main className="min-h-screen bg-black px-4 py-10 text-white">
          <div className="mx-auto max-w-7xl">
            <section className="rounded-[34px] border border-red-500/30 bg-[#111111] p-8 shadow-2xl">
              <span className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400">
                Progress Report Error
              </span>

              <h1 className="mt-6 text-4xl font-extrabold text-white">
                Unable to load report
              </h1>

              <p className="mt-4 text-slate-300">
                {error || "Progress report data not found."}
              </p>

              <button
                type="button"
                onClick={fetchProgressReport}
                className="mt-6 rounded-full bg-orange-500 px-6 py-3 font-extrabold text-black"
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
      <main className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <section className="rounded-[34px] border border-orange-500/30 bg-[#111111] p-8 shadow-2xl">
            <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400">
              Progress Report
            </span>

            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-center">
              <div>
                <h1 className="text-4xl font-extrabold leading-tight text-white md:text-6xl">
                  Your Health & Fitness{" "}
                  <span className="text-orange-400">Progress Summary</span>
                </h1>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                  This report summarizes BMI, health risk, nutrition, diet
                  recommendation, sleep, fitness goal, goal progress, and
                  overall progress using real backend data.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
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

                <div className="no-print mt-8 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={fetchProgressReport}
                    disabled={generating}
                    className="rounded-full bg-orange-500 px-6 py-3 font-extrabold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {generating ? "Generating..." : "Generate Latest Report"}
                  </button>

                  <button
                    type="button"
                    onClick={downloadReport}
                    className="rounded-full border border-orange-500/40 bg-black px-6 py-3 font-extrabold text-orange-300 transition hover:bg-orange-500/10"
                  >
                    Download / Print Report
                  </button>
                </div>
              </div>

              <div className="rounded-[30px] border border-orange-500/30 bg-black p-7 text-center">
                <p className="text-sm font-bold text-orange-400">
                  Overall Progress
                </p>

                <h2 className="mt-4 text-7xl font-extrabold text-white">
                  {summary.overall_score}%
                </h2>

                <p className="mt-3 text-sm font-semibold text-slate-400">
                  Based on BMI, risk, nutrition, diet, sleep, and goals.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
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
              note="Sleep summary"
            />
          </section>

          <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
            <div className="space-y-8">
              <Panel title="Body & Health Analysis">
                <div className="grid gap-5 md:grid-cols-2">
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
                <div className="grid gap-5 md:grid-cols-2">
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

                <div className="mt-6 rounded-3xl border border-orange-500/25 bg-orange-500/10 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-orange-400">
                      Goal Progress
                    </span>

                    <strong className="text-xl font-extrabold text-white">
                      {summary.goal_progress}%
                    </strong>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-black">
                    <div
                      className="h-full rounded-full bg-orange-500"
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
                <div className="grid gap-5 md:grid-cols-2">
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
                <div className="grid gap-5 md:grid-cols-2">
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

              <Panel title="Nutrition & Lifestyle">
                <div className="grid gap-5 md:grid-cols-2">
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

            <aside className="space-y-8">
              <Panel title="Final Recommendation">
                {report.recommendations.length === 0 ? (
                  <p className="text-sm font-semibold leading-7 text-slate-300">
                    No recommendations available.
                  </p>
                ) : (
                  <ul className="space-y-4 text-sm font-semibold leading-7 text-slate-300">
                    {report.recommendations.map((item) => (
                      <li
                        key={item}
                        className="rounded-2xl border border-orange-500/20 bg-black p-4"
                      >
                        ✓ {item}
                      </li>
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

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300">
      {label}
    </span>
  );
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
    <div className="rounded-[28px] border border-orange-500/30 bg-[#111111] p-6 shadow-xl">
      <p className="text-sm font-bold text-orange-400">{title}</p>

      <h3 className="mt-3 text-3xl font-extrabold text-white">{value}</h3>

      <p className="mt-2 text-sm font-semibold text-slate-400">{note}</p>
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
    <section className="rounded-[32px] border border-orange-500/30 bg-[#111111] p-7 shadow-2xl">
      <h2 className="mb-6 text-2xl font-extrabold text-white">{title}</h2>
      {children}
    </section>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-orange-500/20 bg-black p-5">
      <p className="text-sm font-bold text-orange-400">{label}</p>

      <h3 className="mt-2 text-xl font-extrabold text-white">{value}</h3>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-2xl border border-orange-500/20 bg-black px-4 py-4">
      <span className="text-sm font-bold text-slate-300">{label}</span>

      <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-extrabold text-orange-300">
        {value}
      </span>
    </div>
  );
}