"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type HealthRiskResult = {
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  activity_level: string;
  systolic_bp: number;
  diastolic_bp: number;
  cholesterol: number;
  smoker: string;
  predicted_risk_level: string;
  confidence: number;
  plan_title: string;
  message: string;
  recommendations: string[];
  model_name: string;
  algorithm: string;
  model_accuracy: number;
  disclaimer: string;
};

export default function HealthRiskPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const [result, setResult] = useState<HealthRiskResult | null>(null);

  const [formData, setFormData] = useState({
    age: "",
    gender: "Male",
    height_cm: "",
    weight_kg: "",
    activity_level: "Sedentary",
    systolic_bp: "",
    diastolic_bp: "",
    cholesterol: "180",
    smoker: "No",
  });

  useEffect(() => {
    const token = localStorage.getItem("fitlife_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    fetchProfileDetails();
    setChecking(false);
  }, [router]);

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
      }));

      setProfileMessage("Profile details loaded automatically.");
    } catch (err) {
      setProfileMessage(
        "Profile details not found. You can enter health details manually."
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    const age = Number(formData.age);
    const height = Number(formData.height_cm);
    const weight = Number(formData.weight_kg);
    const systolicBP = Number(formData.systolic_bp);
    const diastolicBP = Number(formData.diastolic_bp);

    const cholesterolValue =
      formData.cholesterol.trim() === ""
        ? 180
        : Number(formData.cholesterol);

    if (age < 10 || age > 100) {
      setError("Age must be between 10 and 100.");
      setLoading(false);
      return;
    }

    if (height <= 0 || height < 100 || height > 230) {
      setError("Height must be between 100cm and 230cm.");
      setLoading(false);
      return;
    }

    if (weight <= 0 || weight < 30 || weight > 250) {
      setError("Weight must be between 30kg and 250kg.");
      setLoading(false);
      return;
    }

    if (systolicBP < 70 || systolicBP > 250) {
      setError("Systolic BP must be between 70 and 250.");
      setLoading(false);
      return;
    }

    if (diastolicBP < 40 || diastolicBP > 150) {
      setError("Diastolic BP must be between 40 and 150.");
      setLoading(false);
      return;
    }

    if (cholesterolValue < 80 || cholesterolValue > 400) {
      setError(
        "Cholesterol must be between 80 and 400. If you do not know it, use 180."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await apiRequest("/api/health-risk/predict", {
        method: "POST",
        body: JSON.stringify({
          age: age,
          gender: formData.gender,
          height_cm: height,
          weight_kg: weight,
          activity_level: formData.activity_level,
          systolic_bp: systolicBP,
          diastolic_bp: diastolicBP,
          cholesterol: cholesterolValue,
          smoker: formData.smoker,
        }),
      });

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="authCheckingPage">
        <div className="authCheckingBox">
          <h2>Checking access...</h2>
          <p>Please login to use health risk prediction.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="healthRiskPage">
      <section className="healthRiskHero">
        <div className="container">
          <span className="pageBadge">AI Health Prediction</span>

          <h1>Health Risk Prediction</h1>

          <p>
            Your profile details such as age, gender, height, weight, and
            activity level will be automatically filled from your saved profile.
          </p>
        </div>
      </section>

      <section className="healthRiskSection">
        <div className="container healthRiskGrid">
          <form className="healthRiskForm" onSubmit={handleSubmit}>
            <h2>Enter Health Details</h2>

            <p className="helperText">
              {profileLoading
                ? "Loading your profile details..."
                : "You can edit these values before predicting health risk."}
            </p>

            {profileMessage && <p className="helperText">{profileMessage}</p>}

            <div className="formGrid">
              <label>
                Age
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="10"
                  max="100"
                  placeholder="Example: 25"
                  required
                />
              </label>

              <label>
                Gender
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>

              <label>
                Height cm
                <input
                  type="number"
                  name="height_cm"
                  value={formData.height_cm}
                  onChange={handleChange}
                  min="100"
                  max="230"
                  placeholder="Example: 170"
                  required
                />
              </label>

              <label>
                Weight kg
                <input
                  type="number"
                  name="weight_kg"
                  value={formData.weight_kg}
                  onChange={handleChange}
                  min="30"
                  max="250"
                  placeholder="Example: 75"
                  required
                />
              </label>

              <label>
                Activity Level
                <select
                  name="activity_level"
                  value={formData.activity_level}
                  onChange={handleChange}
                >
                  <option value="Sedentary">Sedentary</option>
                  <option value="Lightly Active">Lightly Active</option>
                  <option value="Moderately Active">Moderately Active</option>
                  <option value="Very Active">Very Active</option>
                </select>
              </label>

              <label>
                Systolic BP
                <input
                  type="number"
                  name="systolic_bp"
                  value={formData.systolic_bp}
                  onChange={handleChange}
                  min="70"
                  max="250"
                  placeholder="Example: 120"
                  required
                />
              </label>

              <label>
                Diastolic BP
                <input
                  type="number"
                  name="diastolic_bp"
                  value={formData.diastolic_bp}
                  onChange={handleChange}
                  min="40"
                  max="150"
                  placeholder="Example: 80"
                  required
                />
              </label>

              <label>
                Cholesterol mg/dL
                <input
                  type="number"
                  name="cholesterol"
                  value={formData.cholesterol}
                  onChange={handleChange}
                  min="80"
                  max="400"
                  placeholder="Default: 180"
                />
              </label>

              <label>
                Smoker
                <select
                  name="smoker"
                  value={formData.smoker}
                  onChange={handleChange}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </label>
            </div>

            <p className="helperText">
              If you do not know your cholesterol level, keep the default value
              as 180 mg/dL. Blood pressure and smoking details must be entered
              manually because they are not saved in profile yet.
            </p>

            {error && <p className="errorText">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Predicting..." : "Predict Health Risk"}
            </button>
          </form>

          <div className="healthRiskResult">
            {!result ? (
              <div className="emptyResult">
                <h2>No Prediction Yet</h2>
                <p>Fill the form and click predict to view the result.</p>
              </div>
            ) : (
              <>
                <span className="riskBadge">
                  {result.predicted_risk_level}
                </span>

                <h2>{result.plan_title}</h2>

                <p>{result.message}</p>

                <div className="resultStats">
                  <div>
                    <strong>{result.bmi}</strong>
                    <span>BMI</span>
                  </div>

                  <div>
                    <strong>{result.confidence}%</strong>
                    <span>Confidence</span>
                  </div>

                  <div>
                    <strong>{Math.round(result.model_accuracy * 100)}%</strong>
                    <span>Model Accuracy</span>
                  </div>
                </div>

                <h3>Input Summary</h3>

                <div className="riskSummary">
                  <p>
                    <strong>Age:</strong> {result.age}
                  </p>

                  <p>
                    <strong>Gender:</strong> {result.gender}
                  </p>

                  <p>
                    <strong>Height:</strong> {result.height_cm} cm
                  </p>

                  <p>
                    <strong>Weight:</strong> {result.weight_kg} kg
                  </p>

                  <p>
                    <strong>BP:</strong> {result.systolic_bp}/
                    {result.diastolic_bp}
                  </p>

                  <p>
                    <strong>Cholesterol:</strong> {result.cholesterol} mg/dL
                  </p>

                  <p>
                    <strong>Activity:</strong> {result.activity_level}
                  </p>

                  <p>
                    <strong>Smoker:</strong> {result.smoker}
                  </p>
                </div>

                <h3>Recommendations</h3>

                <ul>
                  {result.recommendations.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <p className="modelInfo">
                  Model: {result.algorithm} | {result.model_name}
                </p>

                <p className="disclaimer">{result.disclaimer}</p>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
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

  if (value === "sedentary") return "Sedentary";
  if (value === "light") return "Lightly Active";
  if (value === "lightly active") return "Lightly Active";
  if (value === "moderate") return "Moderately Active";
  if (value === "moderately active") return "Moderately Active";
  if (value === "active") return "Moderately Active";
  if (value === "very active") return "Very Active";
  if (value === "very_active") return "Very Active";

  return "";
}