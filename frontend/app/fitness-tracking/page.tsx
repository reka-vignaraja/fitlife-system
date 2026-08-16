"use client";

import { FormEvent, useEffect, useState } from "react";
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

type ProfileSummary = {
  name: string;
  email: string;
};

export default function FitnessTrackingPage() {
  const [formData, setFormData] = useState({
    age: "",
    gender: "male",
    height_cm: "",
    weight_kg: "",
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

  const [profileSummary, setProfileSummary] = useState<ProfileSummary>({
    name: "FitLife User",
    email: "",
  });

  const [result, setResult] = useState<FitnessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  async function fetchProfileDetails() {
    try {
      setProfileLoading(true);

      const data = await apiRequest("/api/profile/me", {
        method: "GET",
      });

      const profile = data.profile;

      setProfileSummary({
        name: profile.full_name || "FitLife User",
        email: profile.email || "",
      });

      setFormData((prev) => ({
        ...prev,
        age: profile.age ? String(profile.age) : prev.age,
        gender: normalizeGender(profile.gender) || prev.gender,
        height_cm: profile.height_cm ? String(profile.height_cm) : prev.height_cm,
        weight_kg: profile.weight_kg ? String(profile.weight_kg) : prev.weight_kg,
        fitness_level:
          normalizeFitnessLevel(profile.fitness_level) || prev.fitness_level,
        activity_level:
          normalizeActivityLevel(profile.activity_level) || prev.activity_level,
        goal: normalizeGoal(profile.fitness_goal) || prev.goal,
        workout_days_per_week: profile.workout_days
          ? String(profile.workout_days)
          : prev.workout_days_per_week,
        equipment: normalizeEquipment(profile.equipment) || prev.equipment,
        injuries: profile.injury_details || prev.injuries,
        health_conditions:
          profile.health_conditions || prev.health_conditions,
        notes: buildProfileNote(
          profile.fitness_goal,
          profile.activity_level,
          profile.health_conditions
        ),
      }));

      setProfileMessage("Profile fitness details loaded automatically.");
    } catch (err) {
      setProfileMessage(
        "Profile details not found. You can enter fitness details manually."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const generateFitnessPlan = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!formData.age || !formData.height_cm || !formData.weight_kg) {
      setError("Please fill age, height, and weight.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest("/api/fitness/generate", {
        method: "POST",
        body: JSON.stringify({
          age: Number(formData.age),
          gender: formData.gender,
          height_cm: Number(formData.height_cm),
          weight_kg: Number(formData.weight_kg),
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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate fitness plan."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="fitnessPage">
        <section className="fitnessHero">
          <div className="container">
            <span className="badge">AI Fitness Guider</span>

            <h1>Personalized AI Fitness Plan</h1>

            <p>
              Your saved profile details such as age, gender, height, weight,
              activity level, fitness goal, fitness level, workout days,
              equipment, injuries, and health conditions will be automatically
              filled.
            </p>
          </div>
        </section>

        <section className="fitnessSection">
          <div className="container fitnessGrid">
            <div className="fitnessFormCard">
              <h2>Fitness Guider Details</h2>

              <p>
                {profileLoading
                  ? "Loading your profile details..."
                  : "You can edit these values before generating your workout plan."}
              </p>

              {profileMessage && (
                <div className="fitnessRecommendationBox">
                  <p>{profileMessage}</p>
                </div>
              )}

              <div className="fitnessSummaryGrid">
                <div>
                  <span>Name</span>
                  <strong>{profileSummary.name}</strong>
                  <p>{profileSummary.email || "Profile user"}</p>
                </div>

                <div>
                  <span>Goal</span>
                  <strong>{displayValue(formData.goal)}</strong>
                  <p>Profile fitness goal</p>
                </div>

                <div>
                  <span>Level</span>
                  <strong>{displayValue(formData.fitness_level)}</strong>
                  <p>Fitness level</p>
                </div>

                <div>
                  <span>Equipment</span>
                  <strong>{displayValue(formData.equipment)}</strong>
                  <p>Available option</p>
                </div>
              </div>

              {error && <div className="errorMessage">{error}</div>}

              <form onSubmit={generateFitnessPlan} className="fitnessForm">
                <div className="fitnessFormGrid">
                  <div className="fitnessFormGroup">
                    <label>Age</label>

                    <input
                      type="number"
                      name="age"
                      placeholder="25"
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="fitnessFormGroup">
                    <label>Gender</label>

                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div className="fitnessFormGroup">
                    <label>Height cm</label>

                    <input
                      type="number"
                      name="height_cm"
                      placeholder="170"
                      value={formData.height_cm}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="fitnessFormGroup">
                    <label>Weight kg</label>

                    <input
                      type="number"
                      name="weight_kg"
                      placeholder="75"
                      value={formData.weight_kg}
                      onChange={handleChange}
                    />
                  </div>

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

                <div className="fitnessFormGroup">
                  <label>Extra Notes</label>

                  <textarea
                    name="notes"
                    placeholder="Example: I want home workout plan"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

                <button
                  type="submit"
                  className="fitnessSubmitBtn"
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate AI Fitness Plan"}
                </button>
              </form>
            </div>

            <div className="fitnessResultCard">
              {!result ? (
                <>
                  <h2>AI Fitness Plan Preview</h2>

                  <p>
                    The AI Fitness Guider will generate a personalized weekly
                    workout plan after submitting your details.
                  </p>

                  <div className="fitnessRecommendationBox">
                    <h3>Fitness Guider Includes</h3>

                    <ul>
                      <li>Weekly workout plan</li>
                      <li>Warm-up and cool-down guidance</li>
                      <li>Main workout exercises</li>
                      <li>Calories burn estimation</li>
                      <li>Safety recommendations</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <h2>Your AI Fitness Plan</h2>

                  <div className="fitnessSummaryGrid">
                    <div>
                      <span>BMI</span>
                      <strong>{result.bmi}</strong>
                      <p>{result.bmi_category}</p>
                    </div>

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
                  </div>

                  <div className="weeklyWorkoutPlan">
                    {result.weekly_plan.map((day) => (
                      <div className="workoutDayCard" key={day.day}>
                        <div className="workoutDayTop">
                          <div>
                            <h3>{day.day}</h3>
                            <p>{day.type}</p>
                          </div>

                          <span>{day.duration_minutes} min</span>
                        </div>

                        <div className="workoutBlock">
                          <b>Warm Up</b>
                          <p>{day.warm_up}</p>
                        </div>

                        <div className="workoutBlock">
                          <b>Main Workout</b>

                          <ul>
                            {day.main_workout.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="workoutBlock">
                          <b>Cool Down</b>
                          <p>{day.cool_down}</p>
                        </div>

                        <div className="workoutNote">{day.note}</div>
                      </div>
                    ))}
                  </div>

                  <div className="fitnessRecommendationBox">
                    <h3>Recommendations</h3>

                    <ul>
                      {result.recommendations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>

                    <p>{result.disclaimer}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}

function normalizeGender(gender?: string) {
  if (!gender) return "";

  const value = gender.toLowerCase();

  if (value === "male") return "male";
  if (value === "female") return "female";

  return "";
}

function normalizeFitnessLevel(level?: string) {
  if (!level) return "";

  const value = level.toLowerCase();

  if (value === "beginner") return "beginner";
  if (value === "intermediate") return "intermediate";
  if (value === "advanced") return "advanced";

  return "";
}

function normalizeActivityLevel(activityLevel?: string) {
  if (!activityLevel) return "";

  const value = activityLevel.toLowerCase();

  if (value === "sedentary") return "sedentary";
  if (value === "light") return "light";
  if (value === "lightly active") return "light";
  if (value === "moderate") return "moderate";
  if (value === "moderately active") return "moderate";
  if (value === "active") return "active";
  if (value === "very active") return "very active";
  if (value === "very_active") return "very active";

  return "";
}

function normalizeGoal(goal?: string) {
  if (!goal) return "";

  const value = goal.toLowerCase();

  if (value === "weight loss") return "weight loss";
  if (value === "muscle gain") return "muscle gain";
  if (value === "endurance") return "endurance";
  if (value === "improve endurance") return "endurance";
  if (value === "maintenance") return "maintenance";
  if (value === "maintain fitness") return "maintenance";
  if (value === "general health") return "maintenance";

  return "";
}

function normalizeEquipment(equipment?: string) {
  if (!equipment) return "";

  const value = equipment.toLowerCase();

  if (value === "no equipment") return "no equipment";
  if (value === "home equipment") return "home";
  if (value === "home") return "home";
  if (value === "dumbbells") return "home";
  if (value === "resistance bands") return "home";
  if (value === "gym") return "gym";

  return "";
}

function buildProfileNote(
  fitnessGoal?: string,
  activityLevel?: string,
  healthConditions?: string
) {
  const parts = [];

  if (fitnessGoal) {
    parts.push(`Fitness goal: ${fitnessGoal}`);
  }

  if (activityLevel) {
    parts.push(`Activity level: ${activityLevel}`);
  }

  if (healthConditions) {
    parts.push(`Health conditions: ${healthConditions}`);
  }

  return parts.join(". ");
}

function displayValue(value: string) {
  if (!value) return "Not set";

  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}