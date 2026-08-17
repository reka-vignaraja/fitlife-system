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
    } catch {
      setProfileMessage(
        "Profile details not found. Please update your profile before prediction."
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
      formData.cholesterol.trim() === "" ? 180 : Number(formData.cholesterol);

    if (!formData.age || !formData.height_cm || !formData.weight_kg) {
      setError(
        "Profile details are missing. Please update age, height, and weight in your profile."
      );
      setLoading(false);
      return;
    }

    if (age < 10 || age > 100) {
      setError("Age must be between 10 and 100.");
      setLoading(false);
      return;
    }

    if (height < 100 || height > 230) {
      setError("Height must be between 100cm and 230cm.");
      setLoading(false);
      return;
    }

    if (weight < 30 || weight > 250) {
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
        "Cholesterol must be between 80 and 400. If you do not know it, keep 180."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await apiRequest("/api/health-risk/predict", {
        method: "POST",
        body: JSON.stringify({
          age,
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
      setError(err instanceof Error ? err.message : "Prediction failed.");
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
    <main className="healthRiskPage healthRiskCompactPage">
      <section className="healthRiskCompactHero">
        <div className="container healthRiskHeroWrap">
          <div>
            <span className="pageBadge">AI Health Prediction</span>
            <h1>Health Risk Prediction</h1>
            <p>
              Basic profile details are loaded automatically. You only need to
              enter blood pressure, cholesterol, and smoking status to generate
              a simple lifestyle risk summary.
            </p>
          </div>

          <div className="healthHeroHighlights">
            <div>
              <strong>Secure</strong>
              <span>Protected user data</span>
            </div>

            <div>
              <strong>Simple</strong>
              <span>Less repeated input</span>
            </div>

            <div>
              <strong>Helpful</strong>
              <span>Clear guidance</span>
            </div>
          </div>
        </div>
      </section>

      <section className="healthRiskCompactSection">
        <div className="container healthRiskCompactGrid">
          <div className="healthRiskLeftPanel">
            <div className="profileLoadedCard">
              <div className="profileLoadedTop">
                <div>
                  <span className="miniLabel">Profile Summary</span>
                  <h2>Auto-loaded Details</h2>
                </div>

                <button
                  type="button"
                  className="textActionBtn"
                  onClick={() => router.push("/profile")}
                >
                  Update Profile
                </button>
              </div>

              <p className="profileStatusText">
                {profileLoading ? "Loading profile details..." : profileMessage}
              </p>

              <div className="profileMiniGrid">
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

                <div className="wideProfileItem">
                  <span>Activity Level</span>
                  <strong>{formData.activity_level || "-"}</strong>
                </div>
              </div>
            </div>

            <form className="healthRiskQuickForm" onSubmit={handleSubmit}>
              <div className="quickFormHeader">
                <div>
                  <span className="miniLabel">Required Health Inputs</span>
                  <h2>Enter Current Measurements</h2>
                </div>
              </div>

              <div className="quickInputGrid">
                <label>
                  Systolic BP
                  <input
                    type="number"
                    name="systolic_bp"
                    value={formData.systolic_bp}
                    onChange={handleChange}
                    min="70"
                    max="250"
                    placeholder="120"
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
                    placeholder="80"
                    required
                  />
                </label>

                <label>
                  Cholesterol
                  <input
                    type="number"
                    name="cholesterol"
                    value={formData.cholesterol}
                    onChange={handleChange}
                    min="80"
                    max="400"
                    placeholder="180"
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

              <p className="healthHelperNote">
                If cholesterol is unknown, keep the default value as 180 mg/dL.
                BMI is used internally by the system, but it is not repeated on
                this page.
              </p>

              {error && <p className="errorText">{error}</p>}

              <button type="submit" disabled={loading} className="predictMainBtn">
                {loading ? "Predicting..." : "Predict Health Risk"}
              </button>
            </form>
          </div>

          <div className="healthRiskRightPanel">
            {!result ? (
              <div className="healthEmptyResult">
                <div className="healthCircleIcon">♡</div>
                <h2>No Prediction Yet</h2>
                <p>
                  After entering the required health measurements, your risk
                  summary and recommendations will appear here.
                </p>

                <div className="healthEmptyList">
                  <span>✓ Profile-based prediction</span>
                  <span>✓ Simple risk summary</span>
                  <span>✓ Lifestyle recommendations</span>
                </div>
              </div>
            ) : (
              <div className="healthResultContent">
                <span className={`riskBadge ${getRiskClass(result.predicted_risk_level)}`}>
                  {result.predicted_risk_level}
                </span>

                <h2>{result.plan_title}</h2>
                <p className="healthResultMessage">{result.message}</p>

                <div className="healthResultStats">
                  <div>
                    <strong>{result.predicted_risk_level}</strong>
                    <span>Risk Level</span>
                  </div>

                  <div>
                    <strong>{getPredictionStrength(result.confidence)}</strong>
                    <span>Prediction Strength</span>
                  </div>

                  <div>
                    <strong>{result.recommendations.length}</strong>
                    <span>Health Tips</span>
                  </div>
                </div>

                <div className="healthRecommendationBox">
                  <h3>Recommended Actions</h3>

                  <ul>
                    {result.recommendations.slice(0, 5).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <details className="healthInputDetails">
                  <summary>View input summary</summary>

                  <div className="healthInputSummary">
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
                </details>

                <p className="healthFriendlyNote">
                  This result is generated using your health inputs and is
                  intended for awareness and lifestyle guidance only.
                </p>

                <p className="healthDisclaimer">{result.disclaimer}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function getPredictionStrength(confidence: number) {
  let value = Number(confidence) || 0;

  if (value <= 1) {
    value = value * 100;
  }

  if (value >= 80) {
    return "Strong";
  }

  if (value >= 60) {
    return "Moderate";
  }

  return "Basic";
}

function getRiskClass(riskLevel: string) {
  const value = riskLevel.toLowerCase();

  if (value.includes("high")) {
    return "riskHigh";
  }

  if (value.includes("medium") || value.includes("moderate")) {
    return "riskMedium";
  }

  return "riskLow";
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