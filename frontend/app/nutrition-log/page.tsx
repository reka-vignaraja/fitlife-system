"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

type NutritionMeal = {
  meal: string;
  target_calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  recommended_foods: string[];
  nutrition_note: string;
};

type NutritionResult = {
  bmi: number;
  bmi_category: string;
  goal: string;
  diet_type: string;
  daily_calorie_target: number;
  daily_macro_targets: {
    protein_g: number;
    carbs_g: number;
    fats_g: number;
  };
  water_target_liters: number;
  current_water_intake_liters: number;
  fiber_target_g: number;
  sugar_limit_g: number;
  sodium_limit_mg: number;
  nutrition_score: number;
  nutrition_chart: NutritionMeal[];
  recommendations: string[];
  disclaimer: string;
};

export default function NutritionLogPage() {
  const [formData, setFormData] = useState({
    age: "",
    gender: "male",
    height_cm: "",
    weight_kg: "",
    activity_level: "moderate",
    goal: "weight loss",
    diet_type: "non vegetarian",
    meals_per_day: "4",
    water_intake_liters: "",
    allergies: "",
    health_conditions: "",
    food_avoid: "",
    daily_food_notes: "",
    notes: "",
  });

  const [result, setResult] = useState<NutritionResult | null>(null);
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
        goal: normalizeGoal(profile.fitness_goal) || prev.goal,
        diet_type: normalizeDietType(profile.diet_preference) || prev.diet_type,
        allergies: profile.allergies || prev.allergies,
        health_conditions:
          profile.health_conditions || prev.health_conditions,
      }));

      setProfileMessage("Profile details loaded automatically.");
    } catch {
      setProfileMessage(
        "Profile details not found. You can enter nutrition details manually."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const generateNutritionPlan = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setResult(null);

    if (
      !formData.age ||
      !formData.height_cm ||
      !formData.weight_kg ||
      !formData.water_intake_liters
    ) {
      setError(
        "Please enter water intake. Profile age, height, and weight are also required."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest("/api/nutrition/generate", {
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
          water_intake_liters: Number(formData.water_intake_liters),
          allergies: formData.allergies || "None",
          health_conditions: formData.health_conditions || "None",
          food_avoid: formData.food_avoid || "None",
          daily_food_notes: formData.daily_food_notes || "",
          notes: formData.notes || "",
        }),
      });

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate nutrition plan."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="nutritionPage nutritionCompactPage">
        <section className="nutritionCompactHero">
          <div className="container nutritionHeroWrap">
            <div>
              <span className="badge">AI Nutrition Generator</span>

              <h1>Personalized Nutrition Analysis</h1>

              <p>
                FitLife uses your saved profile, goal, diet preference, water
                intake, and food notes to generate daily nutrition targets and
                meal-wise guidance.
              </p>
            </div>

            <div className="nutritionHeroHighlights">
              <div>
                <strong>Profile-Based</strong>
                <span>Auto-filled details</span>
              </div>

              <div>
                <strong>Nutrition Score</strong>
                <span>Easy health insight</span>
              </div>

              <div>
                <strong>Meal Guidance</strong>
                <span>Daily food support</span>
              </div>
            </div>
          </div>
        </section>

        <section className="nutritionCompactSection">
          <div className="container nutritionDashboardLayout">
            <div className="nutritionProfileCard nutritionProfileFull">
              <div className="nutritionCardTop">
                <div>
                  <span className="miniLabel">Profile Summary</span>
                  <h2>Auto-loaded Details</h2>
                </div>
              </div>

              <p className="nutritionStatusText">
                {profileLoading ? "Loading profile details..." : profileMessage}
              </p>

              <div className="nutritionProfileGrid">
                <div>
                  <span>Age</span>
                  <strong>{formData.age || "-"}</strong>
                </div>

                <div>
                  <span>Gender</span>
                  <strong>{formatText(formData.gender)}</strong>
                </div>

                <div>
                  <span>Height</span>
                  <strong>
                    {formData.height_cm ? `${formData.height_cm} cm` : "-"}
                  </strong>
                </div>

                <div>
                  <span>Weight</span>
                  <strong>
                    {formData.weight_kg ? `${formData.weight_kg} kg` : "-"}
                  </strong>
                </div>

                <div>
                  <span>Goal</span>
                  <strong>{formatText(formData.goal)}</strong>
                </div>

                <div>
                  <span>Diet Type</span>
                  <strong>{formatText(formData.diet_type)}</strong>
                </div>
              </div>
            </div>

            <div className="nutritionWorkGrid">
              <form onSubmit={generateNutritionPlan} className="nutritionQuickForm">
                <div className="nutritionCardTop">
                  <div>
                    <span className="miniLabel">Nutrition Inputs</span>
                    <h2>Generate Nutrition Plan</h2>
                  </div>
                </div>

                {error && <div className="errorMessage">{error}</div>}

                <div className="nutritionQuickGrid">
                  <label>
                    Activity Level
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
                  </label>

                  <label>
                    Goal
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
                  </label>

                  <label>
                    Diet Type
                    <select
                      name="diet_type"
                      value={formData.diet_type}
                      onChange={handleChange}
                    >
                      <option value="non vegetarian">Non Vegetarian</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="balanced diet">Balanced Diet</option>
                    </select>
                  </label>

                  <label>
                    Meals Per Day
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
                  </label>

                  <label className="nutritionWideInput">
                    Water Intake(L)
                    <input
                      type="number"
                      step="0.1"
                      name="water_intake_liters"
                      placeholder="Example: 1.5"
                      value={formData.water_intake_liters}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <details className="nutritionAdvancedSection">
                  <summary>Health and food preferences</summary>

                  <div className="nutritionQuickGrid">
                    <label>
                      Allergies
                      <input
                        type="text"
                        name="allergies"
                        placeholder="Example: peanuts, milk"
                        value={formData.allergies}
                        onChange={handleChange}
                      />
                    </label>

                    <label>
                      Health Conditions
                      <input
                        type="text"
                        name="health_conditions"
                        placeholder="Example: diabetes, pressure"
                        value={formData.health_conditions}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="nutritionWideInput">
                      Foods to Avoid
                      <input
                        type="text"
                        name="food_avoid"
                        placeholder="Example: egg, fish, fried foods"
                        value={formData.food_avoid}
                        onChange={handleChange}
                      />
                    </label>
                  </div>
                </details>

                <details className="nutritionAdvancedSection">
                  <summary>Daily food notes</summary>

                  <label className="nutritionFullText">
                    Food Notes
                    <textarea
                      name="daily_food_notes"
                      placeholder="Example: I ate rice, chicken, vegetables and one soft drink"
                      value={formData.daily_food_notes}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="nutritionFullText">
                    Extra Notes
                    <textarea
                      name="notes"
                      placeholder="Example: I want healthier food habits"
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </label>
                </details>

                <button
                  type="submit"
                  className="nutritionGenerateBtn"
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate AI Nutrition Plan"}
                </button>
              </form>

              <div className="nutritionCompactRight">
                {!result ? (
                  <div className="nutritionEmptyResult">
                    <div className="nutritionCircleIcon">🥗</div>

                    <h2>Nutrition Plan Preview</h2>

                    <p>
                      Your nutrition score, daily calorie target, water target,
                      macro balance, meal-wise nutrition chart, and guidance will
                      appear here.
                    </p>

                    <div className="nutritionEmptyList">
                      <span>✓ Nutrition score</span>
                      <span>✓ Macro and water targets</span>
                      <span>✓ Meal-wise food recommendations</span>
                    </div>
                  </div>
                ) : (
                  <div className="nutritionResultContent">
                    <span className="nutritionResultBadge">
                      Nutrition Score: {result.nutrition_score}/100
                    </span>

                    <h2>Your AI Nutrition Plan</h2>

                    <p className="nutritionMatchText">
                      {getNutritionLevel(result.nutrition_score)}
                    </p>

                    <div className="nutritionSummaryGrid">
                      <div>
                        <span>Score</span>
                        <strong>{result.nutrition_score}</strong>
                        <p>Nutrition score</p>
                      </div>

                      <div>
                        <span>Calories</span>
                        <strong>{result.daily_calorie_target}</strong>
                        <p>Daily target</p>
                      </div>

                      <div>
                        <span>Water</span>
                        <strong>{result.water_target_liters}L</strong>
                        <p>Daily target</p>
                      </div>

                      <div>
                        <span>Fiber</span>
                        <strong>{result.fiber_target_g}g</strong>
                        <p>Daily target</p>
                      </div>
                    </div>

                    <div className="nutritionMacroBox">
                      <h3>Daily Macro Targets</h3>

                      <div className="nutritionMacroGrid">
                        <div>
                          <span>Protein</span>
                          <strong>{result.daily_macro_targets.protein_g}g</strong>
                        </div>

                        <div>
                          <span>Carbs</span>
                          <strong>{result.daily_macro_targets.carbs_g}g</strong>
                        </div>

                        <div>
                          <span>Fats</span>
                          <strong>{result.daily_macro_targets.fats_g}g</strong>
                        </div>
                      </div>

                      <p>
                        Sugar limit: {result.sugar_limit_g}g | Sodium limit:{" "}
                        {result.sodium_limit_mg}mg
                      </p>
                    </div>

                    <div className="nutritionMealPanel">
                      <h3>Meal-wise Nutrition Chart</h3>

                      <div className="nutritionMealList">
                        {result.nutrition_chart.map((meal) => (
                          <div className="nutritionMealCard" key={meal.meal}>
                            <div className="nutritionMealTop">
                              <div>
                                <h4>{meal.meal}</h4>
                                <p>{meal.target_calories} kcal</p>
                              </div>

                              <span>
                                P {meal.protein_g}g / C {meal.carbs_g}g / F{" "}
                                {meal.fats_g}g
                              </span>
                            </div>

                            <ul className="nutritionFoodsList">
                              {meal.recommended_foods.map((food) => (
                                <li key={`${meal.meal}-${food}`}>
                                  {formatText(food)}
                                </li>
                              ))}
                            </ul>

                            <p>{meal.nutrition_note}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <details
                      className="nutritionAdvancedSection nutritionResultDetails"
                      open
                    >
                      <summary>Practical recommendations</summary>

                      <ul className="nutritionRecommendationList">
                        {result.recommendations.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </details>

                    <p className="nutritionFriendlyNote">
                      This nutrition plan is generated for general health and
                      fitness guidance. It is not a replacement for professional
                      medical or dietician advice.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}

function getNutritionLevel(score: number) {
  if (score >= 80) {
    return "Excellent nutrition balance. Continue maintaining healthy food and water habits.";
  }

  if (score >= 60) {
    return "Good nutrition balance. Some improvements can make your daily intake healthier.";
  }

  if (score >= 40) {
    return "Moderate nutrition balance. Improve hydration, food quality, and meal consistency.";
  }

  return "Needs improvement. Focus on water intake, balanced meals, and reducing unhealthy foods.";
}

function formatText(value: string) {
  if (!value) return "-";

  return value
    .split(" ")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function normalizeGender(gender?: string) {
  if (!gender) return "";

  const value = gender.toLowerCase();

  if (value === "male") return "male";
  if (value === "female") return "female";

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
  if (value === "balanced diet") return "balanced diet";
  if (value === "balanced") return "balanced diet";

  return "";
}