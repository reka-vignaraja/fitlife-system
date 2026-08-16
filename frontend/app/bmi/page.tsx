"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

type BMIResult = {
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  activity_level: string;
  goal: string;
  bmi: number;
  bmi_category: string;
  message: string;
  recommendations: string[];
  disclaimer: string;
};

export default function BMIPage() {
  const [formData, setFormData] = useState({
    age: "",
    gender: "male",
    height_cm: "",
    weight_kg: "",
    activity_level: "moderate",
    goal: "weight loss",
  });

  const [result, setResult] = useState<BMIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

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
      }));

      setProfileMessage("Profile details loaded automatically.");
    } catch (err) {
      setProfileMessage(
        "Profile details not found. You can enter details manually."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const calculateBMI = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setResult(null);

    if (!formData.age || !formData.height_cm || !formData.weight_kg) {
      setError("Please fill age, height, and weight.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest("/api/bmi/calculate", {
        method: "POST",
        body: JSON.stringify({
          age: Number(formData.age),
          gender: formData.gender,
          height_cm: Number(formData.height_cm),
          weight_kg: Number(formData.weight_kg),
          activity_level: formData.activity_level,
          goal: formData.goal,
        }),
      });

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "BMI calculation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="bmiPage">
        <section className="bmiHero">
          <div className="container">
            <span className="badge">BMI Calculator</span>

            <h1>Check Your Body Mass Index</h1>

            <p>
              Your profile details such as age, gender, height, weight, activity
              level, and goal will be automatically filled from your saved
              profile.
            </p>
          </div>
        </section>

        <section className="bmiSection">
          <div className="container bmiGrid">
            <div className="bmiCard">
              <h2>Enter Your Details</h2>

              <p>
                {profileLoading
                  ? "Loading your profile details..."
                  : "You can edit these values before calculating BMI."}
              </p>

              {profileMessage && (
                <div className="bmiInfoBox">
                  <p>{profileMessage}</p>
                </div>
              )}

              {error && <div className="errorMessage">{error}</div>}

              <form onSubmit={calculateBMI} className="bmiForm">
                <div className="bmiFormGrid">
                  <div className="bmiFormGroup">
                    <label>Age</label>
                    <input
                      type="number"
                      name="age"
                      placeholder="Example: 25"
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="bmiFormGroup">
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

                  <div className="bmiFormGroup">
                    <label>Height cm</label>
                    <input
                      type="number"
                      name="height_cm"
                      placeholder="Example: 170"
                      value={formData.height_cm}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="bmiFormGroup">
                    <label>Weight kg</label>
                    <input
                      type="number"
                      name="weight_kg"
                      placeholder="Example: 75"
                      value={formData.weight_kg}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="bmiFormGroup">
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

                  <div className="bmiFormGroup">
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
                </div>

                <button type="submit" className="bmiButton" disabled={loading}>
                  {loading ? "Calculating..." : "Calculate BMI"}
                </button>
              </form>
            </div>

            <div className="bmiCard">
              {!result ? (
                <>
                  <h2>BMI Result</h2>
                  <p>Your BMI result will appear here after calculation.</p>

                  <div className="bmiInfoBox">
                    <h3>BMI Categories</h3>

                    <ul>
                      <li>Underweight: Below 18.5</li>
                      <li>Normal: 18.5 - 24.9</li>
                      <li>Overweight: 25 - 29.9</li>
                      <li>Obese: 30 and above</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <h2>Your BMI Result</h2>

                  <div className="bmiScoreBox">
                    <span>BMI Score</span>
                    <strong>{result.bmi}</strong>
                    <p>{result.bmi_category}</p>
                  </div>

                  <div className="bmiSmallGrid">
                    <div>
                      <span>Age</span>
                      <strong>{result.age}</strong>
                    </div>

                    <div>
                      <span>Gender</span>
                      <strong>{result.gender}</strong>
                    </div>

                    <div>
                      <span>Height</span>
                      <strong>{result.height_cm} cm</strong>
                    </div>

                    <div>
                      <span>Weight</span>
                      <strong>{result.weight_kg} kg</strong>
                    </div>
                  </div>

                  <div className="bmiInfoBox">
                    <h3>Health Message</h3>
                    <p>{result.message}</p>
                  </div>

                  <div className="bmiInfoBox">
                    <h3>Recommendations</h3>

                    <ul>
                      {result.recommendations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>

                    <p className="bmiDisclaimer">{result.disclaimer}</p>
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
  if (value === "moderate") return "moderate";
  if (value === "active") return "active";
  if (value === "very active" || value === "very_active") return "very active";

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