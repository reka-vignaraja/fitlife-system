"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

type SleepResult = {
  age: number;
  gender: string;
  sleep_hours: number;
  sleep_quality: string;
  bedtime: string;
  wake_time: string;
  interruptions: number;
  screen_time_before_bed: string;
  caffeine_after_evening: string;
  stress_level: string;
  notes: string;
  sleep_status: string;
  sleep_score: number;
  recommendations: string[];
  disclaimer: string;
};

type SleepLog = {
  sleep_hours: number;
  sleep_quality: string;
  bedtime: string;
  wake_time: string;
  sleep_score: number;
  sleep_status: string;
  date: string;
};

const initialLogs: SleepLog[] = [
  {
    sleep_hours: 7,
    sleep_quality: "Good",
    bedtime: "10:30 PM",
    wake_time: "5:30 AM",
    sleep_score: 86,
    sleep_status: "Healthy Sleep",
    date: "Today",
  },
  {
    sleep_hours: 5,
    sleep_quality: "Average",
    bedtime: "12:00 AM",
    wake_time: "5:00 AM",
    sleep_score: 58,
    sleep_status: "Insufficient Sleep",
    date: "Yesterday",
  },
];

export default function SleepTrackingPage() {
  const [formData, setFormData] = useState({
    age: "",
    gender: "male",
    sleep_hours: "",
    sleep_quality: "good",
    bedtime: "",
    wake_time: "",
    interruptions: "0",
    screen_time_before_bed: "no",
    caffeine_after_evening: "no",
    stress_level: "medium",
    notes: "",
  });

  const [result, setResult] = useState<SleepResult | null>(null);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>(initialLogs);
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
        notes: buildProfileNote(
          profile.activity_level,
          profile.fitness_goal,
          profile.health_conditions
        ),
      }));

      setProfileMessage("Profile details loaded automatically.");
    } catch (err) {
      setProfileMessage(
        "Profile details not found. You can enter sleep details manually."
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

  const analyzeSleep = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setResult(null);

    if (
      !formData.age ||
      !formData.sleep_hours ||
      !formData.bedtime ||
      !formData.wake_time
    ) {
      setError("Please fill age, sleep hours, bedtime, and wake time.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest("/api/sleep/analyze", {
        method: "POST",
        body: JSON.stringify({
          age: Number(formData.age),
          gender: formData.gender,
          sleep_hours: Number(formData.sleep_hours),
          sleep_quality: formData.sleep_quality,
          bedtime: formData.bedtime,
          wake_time: formData.wake_time,
          interruptions: Number(formData.interruptions),
          screen_time_before_bed: formData.screen_time_before_bed,
          caffeine_after_evening: formData.caffeine_after_evening,
          stress_level: formData.stress_level,
          notes: formData.notes,
        }),
      });

      setResult(data);

      const newLog: SleepLog = {
        sleep_hours: data.sleep_hours,
        sleep_quality: data.sleep_quality,
        bedtime: data.bedtime,
        wake_time: data.wake_time,
        sleep_score: data.sleep_score,
        sleep_status: data.sleep_status,
        date: "Today",
      };

      setSleepLogs((prev) => [newLog, ...prev]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sleep analysis failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="sleepPage">
        <section className="sleepHero">
          <div className="container">
            <span className="badge">AI Sleep Tracking</span>

            <h1>Analyze Your Sleep Quality</h1>

            <p>
              Your saved profile details such as age, gender, activity level,
              fitness goal and health conditions will be automatically filled
              where needed.
            </p>
          </div>
        </section>

        <section className="sleepSection">
          <div className="container sleepGrid">
            <div className="sleepFormCard">
              <h2>Sleep Details</h2>

              <p>
                {profileLoading
                  ? "Loading your profile details..."
                  : "You can edit these values before analyzing your sleep."}
              </p>

              {profileMessage && (
                <div className="sleepInfoBox">
                  <p>{profileMessage}</p>
                </div>
              )}

              {error && <div className="errorMessage">{error}</div>}

              <form onSubmit={analyzeSleep} className="sleepForm">
                <div className="sleepFormGrid">
                  <div className="sleepFormGroup">
                    <label>Age</label>

                    <input
                      type="number"
                      name="age"
                      placeholder="Example: 25"
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="sleepFormGroup">
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

                  <div className="sleepFormGroup">
                    <label>Sleep Hours</label>

                    <input
                      type="number"
                      name="sleep_hours"
                      placeholder="Example: 7"
                      value={formData.sleep_hours}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="sleepFormGroup">
                    <label>Sleep Quality</label>

                    <select
                      name="sleep_quality"
                      value={formData.sleep_quality}
                      onChange={handleChange}
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="average">Average</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>

                  <div className="sleepFormGroup">
                    <label>Bedtime</label>

                    <input
                      type="text"
                      name="bedtime"
                      placeholder="Example: 10:30 PM"
                      value={formData.bedtime}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="sleepFormGroup">
                    <label>Wake Time</label>

                    <input
                      type="text"
                      name="wake_time"
                      placeholder="Example: 5:30 AM"
                      value={formData.wake_time}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="sleepFormGroup">
                    <label>Interruptions</label>

                    <input
                      type="number"
                      name="interruptions"
                      placeholder="Example: 1"
                      value={formData.interruptions}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="sleepFormGroup">
                    <label>Screen Time Before Bed</label>

                    <select
                      name="screen_time_before_bed"
                      value={formData.screen_time_before_bed}
                      onChange={handleChange}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>

                  <div className="sleepFormGroup">
                    <label>Caffeine After Evening</label>

                    <select
                      name="caffeine_after_evening"
                      value={formData.caffeine_after_evening}
                      onChange={handleChange}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>

                  <div className="sleepFormGroup">
                    <label>Stress Level</label>

                    <select
                      name="stress_level"
                      value={formData.stress_level}
                      onChange={handleChange}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="sleepFormGroup">
                  <label>Notes</label>

                  <textarea
                    name="notes"
                    placeholder="Example: I feel tired in the morning"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

                <button
                  type="submit"
                  className="sleepSubmitBtn"
                  disabled={loading}
                >
                  {loading ? "Analyzing..." : "Analyze Sleep"}
                </button>
              </form>
            </div>

            <div className="sleepResultCard">
              {!result ? (
                <>
                  <h2>Sleep Result Preview</h2>

                  <p>Your sleep score and recommendations will appear here.</p>

                  <div className="sleepInfoBox">
                    <h3>Healthy Sleep Guide</h3>

                    <ul>
                      <li>Adults usually need 7 to 9 hours of sleep.</li>
                      <li>Avoid screen time before bedtime.</li>
                      <li>Maintain a consistent sleep routine.</li>
                      <li>Reduce caffeine intake in the evening.</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <h2>Your Sleep Analysis</h2>

                  <div className="sleepScoreBox">
                    <span>Sleep Score</span>
                    <strong>{result.sleep_score}</strong>
                    <p>{result.sleep_status}</p>
                  </div>

                  <div className="sleepSummaryGrid">
                    <div>
                      <span>Sleep Hours</span>
                      <strong>{result.sleep_hours}</strong>
                    </div>

                    <div>
                      <span>Quality</span>
                      <strong>{result.sleep_quality}</strong>
                    </div>

                    <div>
                      <span>Bedtime</span>
                      <strong>{result.bedtime}</strong>
                    </div>

                    <div>
                      <span>Wake Time</span>
                      <strong>{result.wake_time}</strong>
                    </div>
                  </div>

                  <div className="sleepInfoBox">
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

        <section className="sleepHistorySection">
          <div className="container">
            <div className="sleepHistoryHeader">
              <div>
                <span className="badge">History</span>
                <h2>Recent Sleep Logs</h2>
              </div>
            </div>

            <div className="sleepHistoryGrid">
              {sleepLogs.map((log, index) => (
                <div className="sleepHistoryCard" key={`${log.date}-${index}`}>
                  <div>
                    <h3>{log.date}</h3>
                    <p>{log.sleep_status}</p>
                  </div>

                  <div className="sleepHistoryStats">
                    <span>{log.sleep_hours} hrs</span>
                    <span>{log.sleep_quality}</span>
                    <span>{log.sleep_score} score</span>
                  </div>

                  <p>
                    Bedtime: {log.bedtime} | Wake Time: {log.wake_time}
                  </p>
                </div>
              ))}
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

function buildProfileNote(
  activityLevel?: string,
  fitnessGoal?: string,
  healthConditions?: string
) {
  const parts = [];

  if (activityLevel) {
    parts.push(`Activity level: ${activityLevel}`);
  }

  if (fitnessGoal) {
    parts.push(`Fitness goal: ${fitnessGoal}`);
  }

  if (healthConditions) {
    parts.push(`Health conditions: ${healthConditions}`);
  }

  return parts.join(". ");
}