import Link from "next/link";

const features = [
  {
    icon: "⚖️",
    title: "BMI Analysis",
    text: "Calculate BMI and understand the user’s health category.",
  },
  {
    icon: "🥗",
    title: "Diet Recommendation",
    text: "Provide personalized meal suggestions based on user goals.",
  },
  {
    icon: "🏃",
    title: "Fitness Tracking",
    text: "Track workouts, steps, exercise duration, and calories burned.",
  },
  {
    icon: "🍽️",
    title: "Nutrition Logging",
    text: "Record meals, calories, water intake, and nutrition details.",
  },
  {
    icon: "🧘",
    title: "Mental Wellness",
    text: "Track mood, stress level, and receive wellness suggestions.",
  },
  {
    icon: "🎯",
    title: "Goal Management",
    text: "Set health goals and monitor personal progress clearly.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="heroSection">
        <div className="container heroGrid">
          <div className="heroContent">
            <span className="badge">AI-Powered Health & Fitness Assistant</span>

            <h1>
              Manage Your Health with <span>FitLife</span>
            </h1>

            <p>
              FitLife is a professional web-based health and fitness assistant
              that helps users manage BMI, diet, fitness, nutrition, mental
              wellness, sleep, and personal health goals in one platform.
            </p>

            <div className="heroButtons">
              <Link href="/register" className="primaryBtn">
                Get Started
              </Link>

              <Link href="/dashboard" className="secondaryBtn">
                View Dashboard
              </Link>
            </div>

            <div className="statsRow">
              <div>
                <strong>6+</strong>
                <span>Modules</span>
              </div>

              <div>
                <strong>AI</strong>
                <span>Support</span>
              </div>

              <div>
                <strong>24/7</strong>
                <span>Access</span>
              </div>
            </div>
          </div>

          <div className="previewCard">
            <div className="previewHeader">
              <div>
                <span>Today Summary</span>
                <h2>Health Progress</h2>
              </div>

              <b>Good</b>
            </div>

            <div className="previewGrid">
              <div className="previewBox">
                <span>BMI</span>
                <h3>22.4</h3>
                <p>Normal</p>
              </div>

              <div className="previewBox">
                <span>Calories</span>
                <h3>1450</h3>
                <p>Consumed</p>
              </div>

              <div className="previewBox">
                <span>Steps</span>
                <h3>6200</h3>
                <p>Today</p>
              </div>

              <div className="previewBox">
                <span>Mood</span>
                <h3>Happy</h3>
                <p>Low Stress</p>
              </div>
            </div>

            <div className="aiNote">
              <span>AI Suggestion</span>
              <p>
                Maintain balanced meals, drink enough water, and complete a
                30-minute workout today.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="featureSection">
        <div className="container">
          <div className="sectionTitle">
            <span className="badge">Main Features</span>
            <h2>Complete Health Management System</h2>
            <p>
              FitLife combines tracking, analysis, and smart recommendations to
              support a healthier lifestyle.
            </p>
          </div>

          <div className="featureGrid">
            {features.map((item) => (
              <div className="featureCard" key={item.title}>
                <div className="featureIcon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}