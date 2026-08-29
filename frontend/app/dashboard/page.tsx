"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardCard from "@/components/DashboardCard";

type AiMessage = {
  role: "assistant" | "user";
  text: string;
};

const summaryCards = [
  {
    title: "BMI Status",
    value: "22.4",
    description: "Normal weight category",
    icon: "⚖️",
  },
  {
    title: "Health Risk",
    value: "AI",
    description: "Predict Low, Medium, or High risk",
    icon: "🩺",
  },
  {
    title: "Fitness Progress",
    value: "Smart",
    description: "Track weekly workout progress",
    icon: "🏃",
  },
  {
    title: "Sleep Score",
    value: "78",
    description: "Analyze sleep quality and consistency",
    icon: "🌙",
  },
];

const modules = [
  {
    title: "Health Risk Prediction",
    text: "Predict Low, Medium, or High health risk using AI-supported analysis.",
    href: "/health-risk",
    icon: "🩺",
  },
  {
    title: "BMI Analysis",
    text: "Calculate and monitor BMI using height and weight.",
    href: "/bmi",
    icon: "⚖️",
  },
  {
    title: "Diet Recommendation",
    text: "Generate personalised diet and meal suggestions.",
    href: "/diet-recommendation",
    icon: "🥗",
  },
  {
    title: "Nutrition Log",
    text: "Analyze calories, macros, water intake and nutrition score.",
    href: "/nutrition-log",
    icon: "🍽️",
  },
  {
    title: "Fitness Tracking",
    text: "Generate workout plans and track weekly fitness progress.",
    href: "/fitness-tracking",
    icon: "🏃",
  },
  {
    title: "Sleep Tracking",
    text: "Analyze sleep hours, sleep score, quality and weekly consistency.",
    href: "/sleep-tracking",
    icon: "🌙",
  },
  {
    title: "Goals",
    text: "Set personal health goals and monitor progress.",
    href: "/goals",
    icon: "🎯",
  },
  {
    title: "Progress Report",
    text: "Generate a complete summary of your health, diet, fitness and sleep progress.",
    href: "/progress-report",
    icon: "📊",
  },
];

const recentActivities = [
  {
    title: "Health risk prediction ready",
    time: "Today",
    status: "AI",
  },
  {
    title: "BMI module available",
    time: "Today",
    status: "Active",
  },
  {
    title: "Diet recommendation enabled",
    time: "Today",
    status: "Ready",
  },
  {
    title: "Sleep tracking updated",
    time: "Today",
    status: "Weekly",
  },
  {
    title: "Fitness guider connected",
    time: "Today",
    status: "Smart",
  },
];

const suggestedQuestions = [
  "Explain my BMI result",
  "How can I improve my sleep?",
  "Give me beginner fitness advice",
  "How can I improve my diet plan?",
];

const initialAiMessages: AiMessage[] = [
  {
    role: "assistant",
    text: "Hi, I am your FitLife AI Assistant. Ask me about BMI, health risk, diet, fitness, sleep or progress reports.",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiMessages, setAiMessages] = useState<AiMessage[]>(initialAiMessages);
  const [aiThinking, setAiThinking] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("fitlife_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setChecking(false);
  }, [router]);

  const openAiChat = () => {
    setShowAiChat(true);

    setTimeout(() => {
      document.getElementById("dashboardAiChat")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const submitAiQuestion = (questionText: string) => {
    const question = questionText.trim();

    if (!question || aiThinking) return;

    setShowAiChat(true);
    setAiQuestion("");
    setAiThinking(true);

    setAiMessages((prev) => [...prev, { role: "user", text: question }]);

    setTimeout(() => {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: generateLocalAiReply(question),
        },
      ]);

      setAiThinking(false);
    }, 650);
  };

  const handleAiSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitAiQuestion(aiQuestion);
  };

  if (checking) {
    return (
      <main className="authCheckingPage">
        <div className="authCheckingBox">
          <h2>Checking access...</h2>
          <p>Please login to continue using FitLife features.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboardPage">
      <section className="dashboardHero">
        <div className="dashboardContainer">
          <div className="dashboardHeroInner">
            <div className="dashboardHeroText">
              <span className="dashboardBadge">User Dashboard</span>

              <h1>Your Smart Health and Fitness Control Center</h1>

              <p>
                Monitor your BMI, health risk, diet, nutrition, fitness, sleep,
                goals and progress reports from one intelligent FitLife
                dashboard.
              </p>

              <div className="dashboardHeroActions">
                <Link href="/health-risk" className="dashboardPrimaryBtn">
                  Predict Health Risk
                </Link>

                <button
                  type="button"
                  className="dashboardSecondaryBtn"
                  onClick={openAiChat}
                >
                  Ask FitLife AI
                </button>
              </div>
            </div>

            <div className="dashboardHeroVisual">
              <div className="heroVisualTop">
                <span>FitLife AI</span>
                <strong>Smart Guidance</strong>
              </div>

              <div className="heroVisualCard">
                <div>
                  <p>Today’s Focus</p>
                  <h3>Improve Sleep and Fitness Progress</h3>
                </div>

                <span>✨</span>
              </div>

              <div className="heroMiniGrid">
                <div>
                  <strong>AI</strong>
                  <p>Health Risk</p>
                </div>

                <div>
                  <strong>78</strong>
                  <p>Sleep Score</p>
                </div>

                <div>
                  <strong>4</strong>
                  <p>Workout Days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboardContent">
        <div className="dashboardContainer">
          <div className="summaryGrid">
            {summaryCards.map((card) => (
              <DashboardCard
                key={card.title}
                title={card.title}
                value={card.value}
                description={card.description}
                icon={card.icon}
              />
            ))}
          </div>

          <section className="aiAssistantBanner">
            <div>
              <span className="dashboardBadge darkBadge">New AI Feature</span>
              <h2>Ask FitLife AI Assistant</h2>
              <p>
                Get simple explanations about your BMI, health risk result, diet
                plan, fitness progress, sleep improvement and progress report.
              </p>
            </div>

            <button
              type="button"
              className="aiAssistantBtn"
              onClick={openAiChat}
            >
              Open AI Assistant →
            </button>
          </section>

          {showAiChat && (
            <section className="dashboardAiChatPanel" id="dashboardAiChat">
              <div className="dashboardAiChatHeader">
                <div>
                  <span className="dashboardBadge darkBadge">
                    FitLife AI Assistant
                  </span>

                  <h2>Ask Your Health and Fitness Assistant</h2>

                  <p>
                    This assistant gives simple guidance about BMI, health risk,
                    diet, fitness, sleep and progress reports.
                  </p>
                </div>

                <button
                  type="button"
                  className="dashboardAiCloseBtn"
                  onClick={() => setShowAiChat(false)}
                >
                  Close
                </button>
              </div>

              <div className="dashboardAiSuggested">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => submitAiQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>

              <div className="dashboardAiMessages">
                {aiMessages.map((msg, index) => (
                  <div
                    key={`${msg.role}-${index}`}
                    className={
                      msg.role === "assistant"
                        ? "dashboardAiMessage assistant"
                        : "dashboardAiMessage user"
                    }
                  >
                    {msg.text}
                  </div>
                ))}

                {aiThinking && (
                  <div className="dashboardAiMessage assistant">
                    Thinking...
                  </div>
                )}
              </div>

              <form className="dashboardAiForm" onSubmit={handleAiSubmit}>
                <input
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Ask about BMI, diet, fitness, sleep or health risk..."
                />

                <button type="submit" disabled={aiThinking}>
                  {aiThinking ? "Wait..." : "Send"}
                </button>
              </form>

              <p className="dashboardAiDisclaimer">
                FitLife AI Assistant provides general health and fitness
                guidance only. It does not replace professional medical advice.
              </p>
            </section>
          )}

          <div className="dashboardTwoColumn">
            <div className="modulePanel">
              <div className="panelHeader">
                <div>
                  <span className="dashboardBadge">Modules</span>
                  <h2>Health Management Features</h2>
                </div>
              </div>

              <div className="moduleGrid">
                {modules.map((module) => (
                  <Link
                    href={module.href}
                    key={module.title}
                    className="moduleCard"
                  >
                    <div className="moduleIcon">{module.icon}</div>

                    <h3>{module.title}</h3>

                    <p>{module.text}</p>

                    <span>Open →</span>
                  </Link>
                ))}
              </div>
            </div>

            <aside className="activityPanel">
              <div className="panelHeader">
                <div>
                  <span className="dashboardBadge">Activity</span>
                  <h2>Recent Updates</h2>
                </div>
              </div>

              <div className="activityList">
                {recentActivities.map((item) => (
                  <div className="activityItem" key={item.title}>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.time}</p>
                    </div>

                    <strong>{item.status}</strong>
                  </div>
                ))}
              </div>

              <div className="aiSuggestionBox">
                <span>AI Suggestion</span>

                <p>
                  Start with Health Risk Prediction, then review your BMI, diet,
                  fitness and sleep modules. Use the AI Assistant to understand
                  your results in simple language.
                </p>

                <button type="button" onClick={openAiChat}>
                  Ask AI Assistant →
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function generateLocalAiReply(question: string) {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes("bmi")) {
    return "BMI shows whether your weight is suitable for your height. A normal BMI usually means your weight is within a healthy range. You can maintain it with balanced meals, regular exercise and enough sleep.";
  }

  if (
    lowerQuestion.includes("sleep") ||
    lowerQuestion.includes("bed") ||
    lowerQuestion.includes("rest")
  ) {
    return "To improve sleep, try to keep a regular bedtime, reduce screen time before bed, avoid caffeine late in the day and aim for consistent sleep hours. Tracking weekly sleep progress can help identify patterns.";
  }

  if (
    lowerQuestion.includes("diet") ||
    lowerQuestion.includes("meal") ||
    lowerQuestion.includes("food") ||
    lowerQuestion.includes("calorie")
  ) {
    return "A good diet plan should match your goal, activity level and preferences. Focus on balanced meals with enough protein, healthy carbohydrates, vegetables and water. Avoid skipping meals frequently.";
  }

  if (
    lowerQuestion.includes("fitness") ||
    lowerQuestion.includes("workout") ||
    lowerQuestion.includes("exercise")
  ) {
    return "For fitness improvement, follow a weekly plan based on your level and goal. Beginners should start with simple workouts, proper rest days and gradual progress instead of doing intense workouts too early.";
  }

  if (
    lowerQuestion.includes("risk") ||
    lowerQuestion.includes("health") ||
    lowerQuestion.includes("blood") ||
    lowerQuestion.includes("cholesterol")
  ) {
    return "Health risk prediction helps you understand whether your submitted health values may indicate low, medium or high risk. Use the result as general guidance and consult a healthcare professional for serious concerns.";
  }

  if (
    lowerQuestion.includes("progress") ||
    lowerQuestion.includes("report") ||
    lowerQuestion.includes("summary")
  ) {
    return "The progress report combines your BMI, health risk, diet, nutrition, fitness, sleep and goals into one summary. It helps you review your overall health and fitness progress in a simple way.";
  }

  return "FitLife AI Assistant can help explain BMI, health risk, diet, nutrition, fitness, sleep and progress report results. Please ask a specific question about one of these areas for better guidance.";
}