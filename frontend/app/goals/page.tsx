"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

type Goal = {
  _id: string;
  title: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string;
  priority: string;
  notes: string;
  progress: number;
  status: string;
  recommendations: string[];
};

type ProfileResponse = {
  profile?: {
    fitness_goal?: string;
    weight_kg?: number;
    activity_level?: string;
  };
};

const categoryOptions = [
  { label: "Fitness", value: "fitness" },
  { label: "Weight Loss", value: "weight loss" },
  { label: "Weight Gain", value: "weight gain" },
  { label: "Muscle Gain", value: "muscle gain" },
  { label: "Nutrition", value: "nutrition" },
  { label: "Sleep", value: "sleep" },
];

const priorityOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

export default function GoalsPage() {
  const [formData, setFormData] = useState({
    title: "",
    category: "fitness",
    target_value: "",
    current_value: "",
    unit: "kg",
    deadline: "",
    priority: "medium",
    notes: "",
  });

  const [goals, setGoals] = useState<Goal[]>([]);
  const [progressInputs, setProgressInputs] = useState<Record<string, string>>(
    {}
  );

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProfileDetails();
    fetchGoals();
  }, []);

  const latestGoal = goals[0];

  const totalGoals = goals.length;

  const averageProgress = useMemo(() => {
    if (goals.length === 0) {
      return 0;
    }

    const total = goals.reduce((sum, goal) => {
      return sum + Number(goal.progress || 0);
    }, 0);

    return Math.round(total / goals.length);
  }, [goals]);

  async function fetchProfileDetails() {
    try {
      setProfileLoading(true);

      const data: ProfileResponse = await apiRequest("/api/profile/me", {
        method: "GET",
      });

      const profile = data.profile;

      const fitnessGoal = profile?.fitness_goal || "";
      const weight = profile?.weight_kg ? String(profile.weight_kg) : "";
      const activityLevel = profile?.activity_level || "";

      setFormData((prev) => ({
        ...prev,
        title: getGoalTitle(fitnessGoal) || prev.title,
        category: normalizeGoalCategory(fitnessGoal) || prev.category,
        current_value: weight || prev.current_value,
        unit: "kg",
        notes:
          fitnessGoal || activityLevel
            ? `Profile goal: ${fitnessGoal || "Not set"}. Activity level: ${
                activityLevel || "Not set"
              }.`
            : prev.notes,
      }));

      setProfileMessage(
        "Profile goal and current weight loaded automatically."
      );
    } catch {
      setProfileMessage(
        "Profile details not found. You can create a goal manually."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function fetchGoals() {
    try {
      setPageLoading(true);

      const data = await apiRequest("/api/goals/", {
        method: "GET",
      });

      setGoals(data.goals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load goals.");
    } finally {
      setPageLoading(false);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const createGoal = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (
      !formData.title ||
      !formData.target_value ||
      !formData.current_value ||
      !formData.unit ||
      !formData.deadline
    ) {
      setError("Please fill all required goal fields.");
      return;
    }

    try {
      setLoading(true);

      await apiRequest("/api/goals/create", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          target_value: Number(formData.target_value),
          current_value: Number(formData.current_value),
          unit: formData.unit,
          deadline: formData.deadline,
          priority: formData.priority,
          notes: formData.notes,
        }),
      });

      setMessage("Goal created successfully.");

      setFormData((prev) => ({
        ...prev,
        target_value: "",
        deadline: "",
      }));

      fetchGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create goal.");
    } finally {
      setLoading(false);
    }
  };

  const updateProgressInput = (goalId: string, value: string) => {
    setProgressInputs({
      ...progressInputs,
      [goalId]: value,
    });
  };

  const updateGoalProgress = async (goalId: string) => {
    setError("");
    setMessage("");

    const value = progressInputs[goalId];

    if (!value) {
      setError("Please enter new progress value.");
      return;
    }

    try {
      await apiRequest(`/api/goals/${goalId}/progress`, {
        method: "PATCH",
        body: JSON.stringify({
          current_value: Number(value),
        }),
      });

      setMessage("Goal progress updated successfully.");

      setProgressInputs({
        ...progressInputs,
        [goalId]: "",
      });

      fetchGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update goal.");
    }
  };

  const deleteGoal = async (goalId: string) => {
    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/goals/${goalId}`, {
        method: "DELETE",
      });

      setMessage("Goal deleted successfully.");
      fetchGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete goal.");
    }
  };

  return (
    <ProtectedRoute>
      <main className="goalsPage goalsOrangePage">
        <section className="goalsOrangeHero">
          <div className="container goalsOrangeHeroWrap">
            <div>
              <span className="goalsOrangeBadge">Goal Management</span>

              <h1>Set and Track Your Health Goals</h1>

              <p>
                Your saved profile goal and current weight will be automatically
                filled. You only need to set your target value, deadline, and
                update your progress regularly.
              </p>
            </div>

            <div className="goalsOrangeHeroStats">
              <div>
                <span>Total Goals</span>
                <strong>{totalGoals}</strong>
              </div>

              <div>
                <span>Average Progress</span>
                <strong>{averageProgress}%</strong>
              </div>

              <div>
                <span>Latest Goal</span>
                <strong>{latestGoal ? latestGoal.status : "Not Started"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="goalsOrangeSection">
          <div className="container goalsOrangeGrid">
            <form onSubmit={createGoal} className="goalsOrangeFormCard">
              <div className="goalsOrangeCardHeader">
                <div>
                  <span className="goalsOrangeMiniBadge">Create Goal</span>
                  <h2>Create New Goal</h2>
                </div>

                <p>
                  {profileLoading
                    ? "Loading your profile details..."
                    : "You can edit these values before creating your goal."}
                </p>
              </div>

              {profileMessage && (
                <div className="goalsOrangeNotice">{profileMessage}</div>
              )}

              {error && <div className="goalsOrangeError">{error}</div>}
              {message && <div className="goalsOrangeSuccess">{message}</div>}

              <div className="goalsOrangeFormGrid">
                <label>
                  Goal Title
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Example: Lose 5kg"
                  />
                </label>

                <label>
                  Category
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Target Value
                  <input
                    type="number"
                    name="target_value"
                    value={formData.target_value}
                    onChange={handleChange}
                    placeholder="Example: 55"
                  />
                </label>

                <label>
                  Current Value
                  <input
                    type="number"
                    name="current_value"
                    value={formData.current_value}
                    onChange={handleChange}
                    placeholder="Example: 70"
                  />
                </label>

                <label>
                  Unit
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="kg, hours, days"
                  />
                </label>

                <label>
                  Deadline
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Priority
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="goalsOrangeFullField">
                  Notes
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Example: I want to complete this goal in 2 months"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="goalsOrangePrimaryBtn"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Goal"}
              </button>
            </form>

            <aside className="goalsOrangeSide">
              <div className="goalsOrangeInfoCard">
                <span className="goalsOrangeMiniBadge">Goal Tips</span>

                <h2>Build Consistency</h2>

                <p>
                  Set realistic goals, update your progress weekly, and focus on
                  small consistent actions. FitLife helps you understand progress
                  percentage and goal status.
                </p>

                <div className="goalsOrangeTips">
                  <div>
                    <strong>✓</strong>
                    <p>
                      Profile data is used to pre-fill your goal and current
                      weight.
                    </p>
                  </div>

                  <div>
                    <strong>✓</strong>
                    <p>Set a realistic target value and deadline.</p>
                  </div>

                  <div>
                    <strong>✓</strong>
                    <p>Update progress regularly to improve your report.</p>
                  </div>
                </div>
              </div>

              <div className="goalsOrangeInfoCard">
                <span className="goalsOrangeMiniBadge">Quick Summary</span>

                <div className="goalsOrangeQuickStats">
                  <div>
                    <span>Total Goals</span>
                    <strong>{totalGoals}</strong>
                  </div>

                  <div>
                    <span>Average Progress</span>
                    <strong>{averageProgress}%</strong>
                  </div>

                  <div>
                    <span>Latest Status</span>
                    <strong>{latestGoal ? latestGoal.status : "No Goal"}</strong>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="goalsOrangeHistorySection">
          <div className="container">
            <div className="goalsOrangeHistoryHeader">
              <div>
                <span className="goalsOrangeBadge">Goal History</span>
                <h2>Your Goals</h2>
              </div>
            </div>

            {pageLoading ? (
              <div className="goalsOrangeEmpty">Loading goals...</div>
            ) : goals.length === 0 ? (
              <div className="goalsOrangeEmpty">
                No goals created yet. Create your first goal above.
              </div>
            ) : (
              <div className="goalsOrangeHistoryGrid">
                {goals.map((goal) => (
                  <div className="goalsOrangeGoalCard" key={goal._id}>
                    <div className="goalsOrangeGoalTop">
                      <div>
                        <span>{formatText(goal.category)}</span>
                        <h3>{goal.title}</h3>
                      </div>

                      <strong>{goal.progress}%</strong>
                    </div>

                    <div className="goalsOrangeProgressBar">
                      <div style={{ width: `${goal.progress}%` }} />
                    </div>

                    <div className="goalsOrangeMetaGrid">
                      <div>
                        <span>Current</span>
                        <p>
                          {goal.current_value} {goal.unit}
                        </p>
                      </div>

                      <div>
                        <span>Target</span>
                        <p>
                          {goal.target_value} {goal.unit}
                        </p>
                      </div>

                      <div>
                        <span>Status</span>
                        <p>{goal.status}</p>
                      </div>

                      <div>
                        <span>Deadline</span>
                        <p>{goal.deadline}</p>
                      </div>
                    </div>

                    <div className="goalsOrangeUpdateBox">
                      <input
                        type="number"
                        placeholder="New progress value"
                        value={progressInputs[goal._id] || ""}
                        onChange={(e) =>
                          updateProgressInput(goal._id, e.target.value)
                        }
                      />

                      <button
                        type="button"
                        onClick={() => updateGoalProgress(goal._id)}
                      >
                        Update
                      </button>
                    </div>

                    {goal.recommendations?.length > 0 && (
                      <div className="goalsOrangeRecommendation">
                        <span>Recommendations</span>

                        <ul>
                          {goal.recommendations.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      type="button"
                      className="goalsOrangeDeleteBtn"
                      onClick={() => deleteGoal(goal._id)}
                    >
                      Delete Goal
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}

function getGoalTitle(goal?: string) {
  if (!goal) return "";

  const value = goal.toLowerCase();

  if (value === "weight loss") return "Weight Loss Goal";
  if (value === "weight gain") return "Weight Gain Goal";
  if (value === "muscle gain") return "Muscle Gain Goal";
  if (value === "maintain fitness") return "Maintain Fitness Goal";
  if (value === "general health") return "General Health Goal";

  return `${goal} Goal`;
}

function normalizeGoalCategory(goal?: string) {
  if (!goal) return "";

  const value = goal.toLowerCase();

  if (value === "weight loss") return "weight loss";
  if (value === "weight gain") return "weight gain";
  if (value === "muscle gain") return "muscle gain";
  if (value === "maintain fitness") return "fitness";
  if (value === "general health") return "fitness";

  return "fitness";
}

function formatText(value?: string) {
  if (!value) return "-";

  return value
    .split(" ")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}