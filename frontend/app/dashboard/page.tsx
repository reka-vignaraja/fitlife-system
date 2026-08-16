"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardCard from "@/components/DashboardCard";

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
    title: "Calories",
    value: "1450",
    description: "Calories consumed today",
    icon: "🔥",
  },
  {
    title: "Mood",
    value: "Happy",
    description: "Low stress level today",
    icon: "😊",
  },
];

const modules = [
  {
    title: "Health Risk Prediction",
    text: "Predict Low, Medium, or High health risk using trained AI model.",
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
    text: "Generate personalized AI diet and meal suggestions.",
    href: "/diet-recommendation",
    icon: "🥗",
  },
  {
    title: "Fitness Tracking",
    text: "Generate workout plans based on your fitness goal.",
    href: "/fitness-tracking",
    icon: "🏃",
  },
  {
    title: "Nutrition Log",
    text: "Analyze calories, macros, water intake, and nutrition score.",
    href: "/nutrition-log",
    icon: "🍽️",
  },
  {
    title: "Sleep Tracking",
    text: "Analyze sleep hours, sleep score, quality, and recommendations.",
    href: "/sleep-tracking",
    icon: "🌙",
  },
  {
    title: "Mental Wellness",
    text: "Track mood, stress level, and wellness notes.",
    href: "/mental-wellness",
    icon: "🧘",
  },
  {
    title: "Goals",
    text: "Set health goals and monitor your progress.",
    href: "/goals",
    icon: "🎯",
  },
];

const recentActivities = [
  {
    title: "Health risk model connected",
    time: "Today",
    status: "Ready",
  },
  {
    title: "BMI calculated",
    time: "Today",
    status: "Normal",
  },
  {
    title: "Nutrition analyzed",
    time: "Today",
    status: "Good",
  },
  {
    title: "Sleep analyzed",
    time: "Today",
    status: "78 score",
  },
  {
    title: "Workout plan generated",
    time: "Yesterday",
    status: "30 min",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fitlife_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setChecking(false);
  }, [router]);

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
        <div className="container">
          <div className="dashboardHeroInner">
            <div>
              <span className="badge">User Dashboard</span>

              <h1>Welcome to Your Health Dashboard</h1>

              <p>
                Monitor your BMI, health risk, diet, fitness, nutrition, sleep,
                mental wellness, and personal health goals from one professional
                dashboard.
              </p>
            </div>

            <div className="dashboardHeroActions">
              <Link href="/health-risk" className="primaryBtn">
                Predict Health Risk
              </Link>

              <Link href="/bmi" className="secondaryBtn">
                Calculate BMI
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboardContent">
        <div className="container">
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

          <div className="dashboardTwoColumn">
            <div className="modulePanel">
              <div className="panelHeader">
                <div>
                  <span className="badge">Modules</span>
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
                  <span className="badge">Activity</span>
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
                  Start with the Health Risk Prediction module to understand
                  your current risk level. Then follow suitable diet, fitness,
                  nutrition, sleep, and lifestyle recommendations based on your
                  result.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}