"use client";

import { FormEvent, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

type WellnessLog = {
  mood: string;
  stressLevel: string;
  note: string;
  suggestion: string;
  date: string;
};

const initialLogs: WellnessLog[] = [
  {
    mood: "Happy",
    stressLevel: "Low",
    note: "Feeling good today",
    suggestion: "Continue your positive routine.",
    date: "Today",
  },
  {
    mood: "Tired",
    stressLevel: "Medium",
    note: "Long study/work day",
    suggestion: "Take short breaks and sleep early.",
    date: "Yesterday",
  },
  {
    mood: "Calm",
    stressLevel: "Low",
    note: "Relaxed after meditation",
    suggestion: "Continue meditation practice.",
    date: "Last Week",
  },
];

export default function MentalWellnessPage() {
  const [formData, setFormData] = useState({
    mood: "",
    stressLevel: "",
    note: "",
  });

  const [logs, setLogs] = useState<WellnessLog[]>(initialLogs);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getSuggestion = (mood: string, stressLevel: string) => {
    if (stressLevel === "High") {
      return "Try deep breathing, take a short break, reduce screen time, and speak with someone you trust.";
    }

    if (stressLevel === "Medium") {
      return "Do light exercise, drink water, listen to calm music, and complete tasks one by one.";
    }

    if (mood === "Sad") {
      return "Take rest, write down your feelings, talk to a friend, and do something relaxing.";
    }

    if (mood === "Tired") {
      return "Sleep early, avoid heavy work, drink enough water, and take short breaks.";
    }

    return "Your wellness looks good. Continue healthy routines, positive habits, and regular relaxation.";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!formData.mood || !formData.stressLevel || !formData.note) {
      setError("Please fill all mental wellness fields.");
      return;
    }

    const suggestion = getSuggestion(formData.mood, formData.stressLevel);

    const newLog: WellnessLog = {
      mood: formData.mood,
      stressLevel: formData.stressLevel,
      note: formData.note,
      suggestion,
      date: "Today",
    };

    setLogs([newLog, ...logs]);
    setMessage("Mental wellness log added successfully.");

    setFormData({
      mood: "",
      stressLevel: "",
      note: "",
    });
  };

  return (
    <ProtectedRoute>
    <main className="wellnessPage">
      <section className="wellnessHero">
        <div className="container">
          <span className="badge">Mental Wellness</span>

          <h1>Track Your Mood and Stress Level</h1>

          <p>
            Record your daily mood, stress level, and emotional notes. FitLife
            provides simple wellness suggestions to support mental health.
          </p>
        </div>
      </section>

      <section className="wellnessSection">
        <div className="container wellnessGrid">
          <form onSubmit={handleSubmit} className="wellnessFormCard">
            <div className="formHeader">
              <h2>Add Wellness Log</h2>
              <p>Enter your mood and stress details below.</p>
            </div>

            {error && <div className="errorMessage">{error}</div>}
            {message && <div className="successMessage">{message}</div>}

            <div className="formGrid">
              <div className="formGroup">
                <label>Mood</label>
                <select
                  name="mood"
                  value={formData.mood}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select mood</option>
                  <option value="Happy">Happy</option>
                  <option value="Calm">Calm</option>
                  <option value="Sad">Sad</option>
                  <option value="Tired">Tired</option>
                  <option value="Anxious">Anxious</option>
                  <option value="Motivated">Motivated</option>
                </select>
              </div>

              <div className="formGroup">
                <label>Stress Level</label>
                <select
                  name="stressLevel"
                  value={formData.stressLevel}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select stress level</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="formGroup fullWidth">
                <label>Wellness Note</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Write how you feel today..."
                  className="form-input wellnessTextarea"
                />
              </div>
            </div>

            <button type="submit" className="primaryBtn wellnessSubmitBtn">
              Add Wellness Log
            </button>
          </form>

          <aside className="wellnessSuggestionCard">
            <span>Wellness Support</span>
            <h2>Today’s Mental Health Reminder</h2>

            <p>
              Mental wellness is important for daily productivity and healthy
              living. Take small breaks, breathe deeply, sleep well, and talk to
              someone when you feel stressed.
            </p>

            <div className="wellnessChecklist">
              <div>
                <strong>✓</strong>
                <p>Practice 5 minutes of deep breathing.</p>
              </div>

              <div>
                <strong>✓</strong>
                <p>Take a short walk or stretch your body.</p>
              </div>

              <div>
                <strong>✓</strong>
                <p>Avoid overthinking and reduce screen time before sleep.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="wellnessHistorySection">
        <div className="container">
          <div className="historyHeader">
            <div>
              <span className="badge">Wellness History</span>
              <h2>Recent Mental Wellness Logs</h2>
            </div>
          </div>

          <div className="wellnessHistoryGrid">
            {logs.map((item, index) => (
              <div className="wellnessLogCard" key={`${item.mood}-${index}`}>
                <div className="wellnessLogTop">
                  <div>
                    <span>{item.date}</span>
                    <h3>{item.mood}</h3>
                  </div>

                  <strong>{item.stressLevel} Stress</strong>
                </div>

                <p>{item.note}</p>

                <div className="wellnessAdvice">
                  <span>Suggestion</span>
                  <p>{item.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
    </ProtectedRoute>
  );
}