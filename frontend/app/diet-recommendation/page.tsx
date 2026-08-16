"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

type Meal = {
  meal: string;
  target_calories: number;
  foods: string[];
  portion_guide: string;
};

type DietResult = {
  _id?: string;
  user_id?: string | null;

  bmi: number;
  bmi_category: string;
  daily_calorie_target: number;

  macros: {
    protein_g: number;
    carbs_g: number;
    fats_g: number;
  };

  goal: string;
  diet_type: string;
  meals_per_day: number;

  meal_chart: Meal[];

  diet_recommendation: string;
  confidence: number | null;
  probabilities: Record<string, number> | null;

  model_inputs_used?: Record<string, string | number | null>;

  model_name: string;
  model_version: string;
  algorithm_type: string;
  model_accuracy: number;

  recommendations: string[];
  disclaimer: string;
  created_at?: string;
};

export default function DietRecommendationPage() {
  const [formData, setFormData] = useState({
    age: "",
    gender: "Female",
    height_cm: "",
    weight_kg: "",

    activity_level: "moderate",
    goal: "weight loss",
    diet_type: "vegetarian",
    meals_per_day: "4",

    disease_type: "None",
    severity: "None",
    physical_activity_level: "Moderate",

    daily_caloric_intake: "",
    cholesterol_mg_dl: "",
    blood_pressure_mmhg: "",
    glucose_mg_dl: "",

    dietary_restrictions: "Vegetarian",
    preferred_cuisine: "Asian",

    weekly_exercise_hours: "",

    allergies: "None",
    health_conditions: "None",
    food_avoid: "",
  });

  const [result, setResult] = useState<DietResult | null>(null);
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

      setFormData((prev) => ({
        ...prev,
        age: profile.age ? String(profile.age) : prev.age,
        gender: normalizeGender(profile.gender) || prev.gender,
        height_cm: profile.height_cm ? String(profile.height_cm) : prev.height_cm,
        weight_kg: profile.weight_kg ? String(profile.weight_kg) : prev.weight_kg,
        activity_level:
          normalizeActivityLevel(profile.activity_level) || prev.activity_level,
        physical_activity_level:
          normalizePhysicalActivityLevel(profile.activity_level) ||
          prev.physical_activity_level,
        goal: normalizeGoal(profile.fitness_goal) || prev.goal,
        diet_type: normalizeDietType(profile.diet_preference) || prev.diet_type,
        dietary_restrictions:
          normalizeDietaryRestriction(profile.diet_preference) ||
          prev.dietary_restrictions,
        allergies: profile.allergies || prev.allergies,
        health_conditions:
          profile.health_conditions || prev.health_conditions,
        disease_type:
          profile.health_conditions && profile.health_conditions !== "None"
            ? profile.health_conditions
            : prev.disease_type,
      }));

      setProfileMessage("Profile details loaded automatically.");
    } catch {
      setProfileMessage(
        "Profile details not found. You can enter diet details manually."
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

  const optionalNumber = (value: string) => {
    if (!value || value.trim() === "") {
      return null;
    }

    return Number(value);
  };

  const generateDietPlan = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setResult(null);

    if (!formData.age || !formData.height_cm || !formData.weight_kg) {
      setError("Please fill age, height, and weight.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest("/api/diet/generate", {
        method: "POST",
        body: JSON.stringify({
          age: Number(formData.age),
          gender: formData.gender,

          height_cm: Number(formData.height_cm),
          weight_kg: Number(formData.weight_kg),

          activity_level: formData.activity_level,
          goal: formData.goal,
          diet_type: formData.diet_type,
          meals_per_day: Number(formData.meals_per_day),

          disease_type: formData.disease_type || "None",
          severity: formData.severity || "None",
          physical_activity_level:
            formData.physical_activity_level || formData.activity_level,

          daily_caloric_intake: optionalNumber(formData.daily_caloric_intake),
          cholesterol_mg_dl: optionalNumber(formData.cholesterol_mg_dl),
          blood_pressure_mmhg: optionalNumber(formData.blood_pressure_mmhg),
          glucose_mg_dl: optionalNumber(formData.glucose_mg_dl),

          dietary_restrictions:
            formData.dietary_restrictions || formData.diet_type,
          preferred_cuisine: formData.preferred_cuisine || "Any",

          weekly_exercise_hours: optionalNumber(formData.weekly_exercise_hours),

          allergies: formData.allergies || "None",
          health_conditions: formData.health_conditions || "None",
          food_avoid: formData.food_avoid || "None",
        }),
      });

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate diet plan."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="dietPage">
        <section className="dietHero">
          <div className="container">
            <span className="badge">AI Diet Recommendation</span>

            <h1>Personalized Diet Chart</h1>

            <p>
              Your profile details and health inputs are used to generate a
              personalized AI diet recommendation, meal chart, calorie target,
              macro balance, and practical guidance.
            </p>
          </div>
        </section>

        <section className="dietSection">
          <div className="container dietGrid">
            <div className="dietFormCard">
              <h2>User Requirements</h2>

              <p>
                {profileLoading
                  ? "Loading your profile details..."
                  : "You can edit these values before generating your diet plan."}
              </p>

              {profileMessage && (
                <div className="dietInfoBox">
                  <p>{profileMessage}</p>
                </div>
              )}

              {error && <div className="errorMessage">{error}</div>}

              <form onSubmit={generateDietPlan} className="profileForm">
                <h3>Basic Details</h3>

                <div className="formGrid">
                  <div className="formGroup">
                    <label>Age</label>

                    <input
                      type="number"
                      name="age"
                      placeholder="24"
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Gender</label>

                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label>Height cm</label>

                    <input
                      type="number"
                      name="height_cm"
                      placeholder="162"
                      value={formData.height_cm}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Weight kg</label>

                    <input
                      type="number"
                      name="weight_kg"
                      placeholder="68"
                      value={formData.weight_kg}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="formGroup">
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

                  <div className="formGroup">
                    <label>Goal</label>

                    <select
                      name="goal"
                      value={formData.goal}
                      onChange={handleChange}
                    >
                      <option value="weight loss">Weight Loss</option>
                      <option value="weight gain">Weight Gain</option>
                      <option value="muscle gain">Muscle Gain</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label>Diet Type</label>

                    <select
                      name="diet_type"
                      value={formData.diet_type}
                      onChange={handleChange}
                    >
                      <option value="non vegetarian">Non Vegetarian</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="balanced">Balanced Diet</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label>Meals Per Day</label>

                    <select
                      name="meals_per_day"
                      value={formData.meals_per_day}
                      onChange={handleChange}
                    >
                      <option value="3">3 Meals</option>
                      <option value="4">4 Meals</option>
                      <option value="5">5 Meals</option>
                      <option value="6">6 Meals</option>
                    </select>
                  </div>
                </div>

                <h3>Health Details</h3>

                <div className="formGrid">
                  <div className="formGroup">
                    <label>Disease Type</label>

                    <input
                      type="text"
                      name="disease_type"
                      placeholder="Example: Hypertension"
                      value={formData.disease_type}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Severity</label>

                    <select
                      name="severity"
                      value={formData.severity}
                      onChange={handleChange}
                    >
                      <option value="None">None</option>
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label>Physical Activity Level</label>

                    <select
                      name="physical_activity_level"
                      value={formData.physical_activity_level}
                      onChange={handleChange}
                    >
                      <option value="Sedentary">Sedentary</option>
                      <option value="Light">Light</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Active">Active</option>
                      <option value="Very Active">Very Active</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label>Daily Caloric Intake</label>

                    <input
                      type="number"
                      name="daily_caloric_intake"
                      placeholder="Example: 2100"
                      value={formData.daily_caloric_intake}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Cholesterol mg/dL</label>

                    <input
                      type="number"
                      name="cholesterol_mg_dl"
                      placeholder="Example: 210"
                      value={formData.cholesterol_mg_dl}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Blood Pressure mmHg</label>

                    <input
                      type="number"
                      name="blood_pressure_mmhg"
                      placeholder="Example: 135"
                      value={formData.blood_pressure_mmhg}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Glucose mg/dL</label>

                    <input
                      type="number"
                      name="glucose_mg_dl"
                      placeholder="Example: 95"
                      value={formData.glucose_mg_dl}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Weekly Exercise Hours</label>

                    <input
                      type="number"
                      name="weekly_exercise_hours"
                      placeholder="Example: 3"
                      value={formData.weekly_exercise_hours}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <h3>Food Preferences</h3>

                <div className="formGrid">
                  <div className="formGroup">
                    <label>Dietary Restrictions</label>

                    <input
                      type="text"
                      name="dietary_restrictions"
                      placeholder="Example: Vegetarian"
                      value={formData.dietary_restrictions}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Preferred Cuisine</label>

                    <input
                      type="text"
                      name="preferred_cuisine"
                      placeholder="Example: Asian"
                      value={formData.preferred_cuisine}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="formGroup">
                  <label>Allergies</label>

                  <input
                    type="text"
                    name="allergies"
                    placeholder="Example: peanuts, milk"
                    value={formData.allergies}
                    onChange={handleChange}
                  />
                </div>

                <div className="formGroup">
                  <label>Health Conditions</label>

                  <input
                    type="text"
                    name="health_conditions"
                    placeholder="Example: Hypertension, Diabetes"
                    value={formData.health_conditions}
                    onChange={handleChange}
                  />
                </div>

                <div className="formGroup">
                  <label>Foods to Avoid</label>

                  <input
                    type="text"
                    name="food_avoid"
                    placeholder="Example: fried foods, egg, fish"
                    value={formData.food_avoid}
                    onChange={handleChange}
                  />
                </div>

                <button
                  type="submit"
                  className="profileSubmitBtn"
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate AI Diet Chart"}
                </button>
              </form>
            </div>

            <div className="dietResultCard">
              {!result ? (
                <>
                  <h2>Diet Chart Preview</h2>

                  <p>
                    Your personalized AI diet chart will appear here after
                    submitting your requirements.
                  </p>
                </>
              ) : (
                <>
                  <h2>Your AI Diet Plan</h2>

                  <div className="dietSummaryGrid">
                    <div>
                      <span>BMI</span>
                      <strong>{result.bmi}</strong>
                      <p>{result.bmi_category}</p>
                    </div>

                    <div>
                      <span>Calories</span>
                      <strong>{result.daily_calorie_target}</strong>
                      <p>Daily target</p>
                    </div>

                    <div>
                      <span>Protein</span>
                      <strong>{result.macros.protein_g}g</strong>
                      <p>Per day</p>
                    </div>

                    <div>
                      <span>Carbs</span>
                      <strong>{result.macros.carbs_g}g</strong>
                      <p>Per day</p>
                    </div>
                  </div>

                  <div className="recommendationBox">
                    <h3>AI Model Result</h3>

                    <p>
                      <strong>Diet Recommendation:</strong>{" "}
                      {result.diet_recommendation}
                    </p>

                    <p>
                      <strong>Confidence:</strong>{" "}
                      {result.confidence !== null
                        ? `${result.confidence}%`
                        : "Not available"}
                    </p>

                    <p>
                      <strong>Model Accuracy:</strong>{" "}
                      {result.model_accuracy}%
                    </p>

                    <p>
                      <strong>Algorithm:</strong> {result.algorithm_type}
                    </p>

                    <p>
                      <strong>Model:</strong> {result.model_name}{" "}
                      {result.model_version}
                    </p>
                  </div>

                  {result.probabilities && (
                    <div className="recommendationBox">
                      <h3>Prediction Probabilities</h3>

                      <ul>
                        {Object.entries(result.probabilities).map(
                          ([label, value]) => (
                            <li key={label}>
                              {label}: {value}%
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="mealChart">
                    {result.meal_chart.map((meal) => (
                      <div className="mealCard" key={meal.meal}>
                        <div className="mealTop">
                          <h3>{meal.meal}</h3>
                          <span>{meal.target_calories} kcal</span>
                        </div>

                        <ul>
                          {meal.foods.map((food) => (
                            <li key={food}>{food}</li>
                          ))}
                        </ul>

                        <p>{meal.portion_guide}</p>
                      </div>
                    ))}
                  </div>

                  <div className="recommendationBox">
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

  if (value === "male") return "Male";
  if (value === "female") return "Female";

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

function normalizePhysicalActivityLevel(activityLevel?: string) {
  const normalized = normalizeActivityLevel(activityLevel);

  if (normalized === "sedentary") return "Sedentary";
  if (normalized === "light") return "Light";
  if (normalized === "moderate") return "Moderate";
  if (normalized === "active") return "Active";
  if (normalized === "very active") return "Very Active";

  return "";
}

function normalizeGoal(goal?: string) {
  if (!goal) return "";

  const value = goal.toLowerCase();

  if (value === "weight loss") return "weight loss";
  if (value === "weight gain") return "weight gain";
  if (value === "muscle gain") return "muscle gain";
  if (value === "maintenance") return "maintenance";
  if (value === "maintain fitness") return "maintenance";
  if (value === "general health") return "maintenance";

  return "";
}

function normalizeDietType(dietType?: string) {
  if (!dietType) return "";

  const value = dietType.toLowerCase();

  if (value === "vegetarian") return "vegetarian";
  if (value === "non-vegetarian") return "non vegetarian";
  if (value === "non vegetarian") return "non vegetarian";
  if (value === "vegan") return "vegan";
  if (value === "balanced diet") return "balanced";
  if (value === "balanced") return "balanced";

  return "";
}

function normalizeDietaryRestriction(dietType?: string) {
  const normalized = normalizeDietType(dietType);

  if (normalized === "vegetarian") return "Vegetarian";
  if (normalized === "non vegetarian") return "Non Vegetarian";
  if (normalized === "vegan") return "Vegan";
  if (normalized === "balanced") return "Balanced";

  return "";
}