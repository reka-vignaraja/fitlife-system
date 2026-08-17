"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

type FoodItem = {
  name: string;
  grams: number;
};

type Meal = {
  meal: string;
  target_calories: number;
  foods: string[];
  food_items?: FoodItem[];
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
      setError(
        "Profile details are missing. Please enter age, height, and weight."
      );
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
      <main className="dietPage dietCompactPage">
        <section className="dietCompactHero">
          <div className="container dietHeroWrap">
            <div>
              <span className="badge">AI Diet Recommendation</span>

              <h1>Personalized Diet Chart</h1>

              <p>
                FitLife uses your saved profile details and food preferences to
                generate a simple diet recommendation, calorie target, macro
                balance, meal chart, and estimated gram portions.
              </p>
            </div>

            <div className="dietHeroHighlights">
              <div>
                <strong>Personalized</strong>
                <span>Based on profile</span>
              </div>

              <div>
                <strong>Practical</strong>
                <span>Calories and grams</span>
              </div>

              <div>
                <strong>Simple</strong>
                <span>Easy meal guidance</span>
              </div>
            </div>
          </div>
        </section>

        <section className="dietCompactSection">
          <div className="container dietCompactGrid">
            <div className="dietCompactLeft">
              <div className="dietProfileCard">
                <div className="dietCardTop">
                  <div>
                    <span className="miniLabel">Profile Summary</span>
                    <h2>Auto-loaded Details</h2>
                  </div>
                </div>

                <p className="dietStatusText">
                  {profileLoading ? "Loading profile details..." : profileMessage}
                </p>

                <div className="dietProfileGrid">
                  <div>
                    <span>Age</span>
                    <strong>{formData.age || "-"}</strong>
                  </div>

                  <div>
                    <span>Gender</span>
                    <strong>{formData.gender || "-"}</strong>
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

              <form onSubmit={generateDietPlan} className="dietQuickForm">
                <div className="dietCardTop">
                  <div>
                    <span className="miniLabel">Diet Requirements</span>
                    <h2>Generate Diet Plan</h2>
                  </div>
                </div>

                {error && <div className="errorMessage">{error}</div>}

                <div className="dietQuickGrid">
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
                      <option value="balanced">Balanced Diet</option>
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
                </div>

                <details className="dietAdvancedSection">
                  <summary>Advanced health details</summary>

                  <div className="dietQuickGrid">
                    <label>
                      Disease Type
                      <input
                        type="text"
                        name="disease_type"
                        placeholder="Example: Hypertension"
                        value={formData.disease_type}
                        onChange={handleChange}
                      />
                    </label>

                    <label>
                      Severity
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
                    </label>

                    <label>
                      Physical Activity
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
                    </label>

                    <label>
                      Daily Caloric Intake
                      <input
                        type="number"
                        name="daily_caloric_intake"
                        placeholder="Example: 2100"
                        value={formData.daily_caloric_intake}
                        onChange={handleChange}
                      />
                    </label>

                    <label>
                      Cholesterol mg/dL
                      <input
                        type="number"
                        name="cholesterol_mg_dl"
                        placeholder="Example: 210"
                        value={formData.cholesterol_mg_dl}
                        onChange={handleChange}
                      />
                    </label>

                    <label>
                      Blood Pressure
                      <input
                        type="number"
                        name="blood_pressure_mmhg"
                        placeholder="Example: 135"
                        value={formData.blood_pressure_mmhg}
                        onChange={handleChange}
                      />
                    </label>

                    <label>
                      Glucose mg/dL
                      <input
                        type="number"
                        name="glucose_mg_dl"
                        placeholder="Example: 95"
                        value={formData.glucose_mg_dl}
                        onChange={handleChange}
                      />
                    </label>

                    <label>
                      Weekly Exercise Hours
                      <input
                        type="number"
                        name="weekly_exercise_hours"
                        placeholder="Example: 3"
                        value={formData.weekly_exercise_hours}
                        onChange={handleChange}
                      />
                    </label>
                  </div>
                </details>

                <details className="dietAdvancedSection">
                  <summary>Food preferences</summary>

                  <div className="dietQuickGrid">
                    <label>
                      Dietary Restrictions
                      <input
                        type="text"
                        name="dietary_restrictions"
                        placeholder="Example: Vegetarian"
                        value={formData.dietary_restrictions}
                        onChange={handleChange}
                      />
                    </label>

                    <label>
                      Preferred Cuisine
                      <input
                        type="text"
                        name="preferred_cuisine"
                        placeholder="Example: Asian"
                        value={formData.preferred_cuisine}
                        onChange={handleChange}
                      />
                    </label>

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
                        placeholder="Example: Hypertension"
                        value={formData.health_conditions}
                        onChange={handleChange}
                      />
                    </label>
                  </div>

                  <label className="dietFullInput">
                    Foods to Avoid
                    <input
                      type="text"
                      name="food_avoid"
                      placeholder="Example: fried foods, egg, fish"
                      value={formData.food_avoid}
                      onChange={handleChange}
                    />
                  </label>
                </details>

                <button
                  type="submit"
                  className="dietGenerateBtn"
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate AI Diet Chart"}
                </button>
              </form>
            </div>

            <div className="dietCompactRight">
              {!result ? (
                <div className="dietEmptyResult">
                  <div className="dietCircleIcon">🍽</div>

                  <h2>Diet Chart Preview</h2>

                  <p>
                    Your personalized diet chart, calorie target, macro balance,
                    meal plan, estimated gram portions, and recommendations will
                    appear here.
                  </p>

                  <div className="dietEmptyList">
                    <span>✓ Profile-based recommendation</span>
                    <span>✓ Daily calorie target</span>
                    <span>✓ Meal calories and gram portions</span>
                  </div>
                </div>
              ) : (
                <div className="dietResultContent">
                  <span className="dietResultBadge">
                    {result.diet_recommendation}
                  </span>

                  <h2>Your AI Diet Plan</h2>

                  <p className="dietMatchText">
                    Suitability: {getSuitabilityText(result.confidence)}
                  </p>

                  <div className="dietMacroGrid">
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

                    <div>
                      <span>Fats</span>
                      <strong>{result.macros.fats_g}g</strong>
                      <p>Per day</p>
                    </div>
                  </div>

                  <div className="dietMealPanel">
                    <h3>Meal Chart</h3>

                    <div className="dietMealList">
                      {result.meal_chart.map((meal) => (
                        <div className="dietMealCard" key={meal.meal}>
                          <div className="dietMealTop">
                            <h4>{meal.meal}</h4>
                            <span>{meal.target_calories} kcal</span>
                          </div>

                          <ul>
                            {meal.food_items && meal.food_items.length > 0
                              ? meal.food_items.map((food) => (
                                  <li key={`${meal.meal}-${food.name}`}>
                                    <span>{formatText(food.name)}</span>
                                    <strong>{food.grams}g</strong>
                                  </li>
                                ))
                              : meal.foods.map((food) => (
                                  <li key={`${meal.meal}-${food}`}>
                                    <span>{formatText(food)}</span>
                                  </li>
                                ))}
                          </ul>

                          <p>{meal.portion_guide}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <details className="dietAdvancedSection dietResultDetails" open>
                    <summary>Practical recommendations</summary>

                    <ul className="dietRecommendationList">
                      {result.recommendations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </details>

                  <p className="dietFriendlyNote">
                    This diet plan is generated for general health and fitness
                    guidance. The gram values are estimated portions based on
                    calorie target, meal type, goal, and food category. It is not
                    a replacement for professional medical or dietician advice.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}

function getSuitabilityText(confidence: number | null) {
  if (confidence === null || confidence === undefined) {
    return "Personalized guidance";
  }

  let value = Number(confidence) || 0;

  if (value <= 1) {
    value = value * 100;
  }

  if (value >= 80) {
    return "Good match for your profile";
  }

  if (value >= 60) {
    return "Moderate match for your profile";
  }

  return "Basic guidance based on your details";
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