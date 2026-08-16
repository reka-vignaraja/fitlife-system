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
    } catch (err) {
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
      setError("Please fill age, height, weight, and water intake.");
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
          allergies: formData.allergies,
          health_conditions: formData.health_conditions,
          food_avoid: formData.food_avoid,
          daily_food_notes: formData.daily_food_notes,
          notes: formData.notes,
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
      <main className="nutritionPage">
        <section className="nutritionHero">
          <div className="container">
            <span className="badge">AI Nutrition Generator</span>

            <h1>Personalized Nutrition Analysis</h1>

            <p>
              Your saved profile details such as age, gender, height, weight,
              activity level, goal, diet preference, allergies, and health
              conditions will be automatically filled.
            </p>
          </div>
        </section>

        <section className="nutritionSection">
          <div className="container nutritionGrid">
            <div className="nutritionFormCard">
              <h2>User Nutrition Details</h2>

              <p>
                {profileLoading
                  ? "Loading your profile details..."
                  : "You can edit these values before generating your nutrition plan."}
              </p>

              {profileMessage && (
                <div className="nutritionInfoBox">
                  <p>{profileMessage}</p>
                </div>
              )}

              {error && <div className="errorMessage">{error}</div>}

              <form onSubmit={generateNutritionPlan} className="nutritionForm">
                <div className="nutritionFormGrid">
                  <div className="nutritionFormGroup">
                    <label>Age</label>
                    <input
                      type="number"
                      name="age"
                      placeholder="25"
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="nutritionFormGroup">
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

                  <div className="nutritionFormGroup">
                    <label>Height cm</label>
                    <input
                      type="number"
                      name="height_cm"
                      placeholder="170"
                      value={formData.height_cm}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="nutritionFormGroup">
                    <label>Weight kg</label>
                    <input
                      type="number"
                      name="weight_kg"
                      placeholder="75"
                      value={formData.weight_kg}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="nutritionFormGroup">
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

                  <div className="nutritionFormGroup">
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

                  <div className="nutritionFormGroup">
                    <label>Diet Type</label>
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
                  </div>

                  <div className="nutritionFormGroup">
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

                  <div className="nutritionFormGroup">
                    <label>Water Intake Liters</label>
                    <input
                      type="number"
                      step="0.1"
                      name="water_intake_liters"
                      placeholder="1.5"
                      value={formData.water_intake_liters}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="nutritionFormGroup">
                  <label>Allergies</label>
                  <input
                    type="text"
                    name="allergies"
                    placeholder="Example: peanuts, milk"
                    value={formData.allergies}
                    onChange={handleChange}
                  />
                </div>

                <div className="nutritionFormGroup">
                  <label>Health Conditions</label>
                  <input
                    type="text"
                    name="health_conditions"
                    placeholder="Example: diabetes, pressure"
                    value={formData.health_conditions}
                    onChange={handleChange}
                  />
                </div>

                <div className="nutritionFormGroup">
                  <label>Foods to Avoid</label>
                  <input
                    type="text"
                    name="food_avoid"
                    placeholder="Example: egg, fish"
                    value={formData.food_avoid}
                    onChange={handleChange}
                  />
                </div>

                <div className="nutritionFormGroup">
                  <label>Daily Food Notes</label>
                  <textarea
                    name="daily_food_notes"
                    placeholder="Example: I ate rice, chicken, vegetables and one soft drink"
                    value={formData.daily_food_notes}
                    onChange={handleChange}
                  />
                </div>

                <div className="nutritionFormGroup">
                  <label>Extra Notes</label>
                  <textarea
                    name="notes"
                    placeholder="Example: I want healthier food habits"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

                <button
                  type="submit"
                  className="nutritionSubmitBtn"
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate AI Nutrition Plan"}
                </button>
              </form>
            </div>

            <div className="nutritionResultCard">
              {!result ? (
                <>
                  <h2>Nutrition Plan Preview</h2>

                  <p>
                    Your nutrition targets and meal-wise recommendations will
                    appear here after submitting your details.
                  </p>
                </>
              ) : (
                <>
                  <h2>Your AI Nutrition Plan</h2>

                  <div className="nutritionSummaryGrid">
                    <div>
                      <span>BMI</span>
                      <strong>{result.bmi}</strong>
                      <p>{result.bmi_category}</p>
                    </div>

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
                  </div>

                  <div className="macroTargetBox">
                    <h3>Daily Macro Targets</h3>

                    <div className="macroGrid">
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
                      Fiber target: {result.fiber_target_g}g | Sugar limit:{" "}
                      {result.sugar_limit_g}g | Sodium limit:{" "}
                      {result.sodium_limit_mg}mg
                    </p>
                  </div>

                  <div className="nutritionChart">
                    {result.nutrition_chart.map((meal) => (
                      <div className="nutritionMealCard" key={meal.meal}>
                        <div className="nutritionMealTop">
                          <div>
                            <h3>{meal.meal}</h3>
                            <p>{meal.target_calories} kcal</p>
                          </div>

                          <span>
                            P {meal.protein_g}g / C {meal.carbs_g}g / F{" "}
                            {meal.fats_g}g
                          </span>
                        </div>

                        <ul>
                          {meal.recommended_foods.map((food) => (
                            <li key={food}>{food}</li>
                          ))}
                        </ul>

                        <p>{meal.nutrition_note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="nutritionRecommendationBox">
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

  return "";
}