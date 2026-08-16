import Link from "next/link";

const features = [
  {
    title: "Health Risk Prediction",
    text: "Predict Low Risk, Medium Risk, or High Risk using a trained Decision Tree machine learning model.",
  },
  {
    title: "BMI Analysis",
    text: "Calculate BMI and understand the user's weight category using height and weight.",
  },
  {
    title: "Diet Recommendation",
    text: "Generate suitable diet suggestions based on user goals, BMI, and health condition.",
  },
  {
    title: "Fitness Tracking",
    text: "Generate workout plans based on fitness level, activity level, equipment, and goals.",
  },
  {
    title: "Nutrition Log",
    text: "Analyze food nutrition details such as calories, protein, carbohydrates, fat, sugar, and sodium.",
  },
  {
    title: "Sleep Tracking",
    text: "Analyze sleep hours, sleep quality, stress level, and provide sleep improvement suggestions.",
  },
  {
    title: "Mental Wellness",
    text: "Track mood, stress level, wellness notes, and receive basic wellness recommendations.",
  },
  {
    title: "Goal Management",
    text: "Create health goals, update progress, and monitor goal completion percentage.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="publicPage">
      <section className="publicHero">
        <div className="container">
          <span className="pageBadge">FitLife Features</span>

          <h1>Smart Health and Fitness Features</h1>

          <p>
            FitLife helps users monitor health, predict risk level, manage
            fitness goals, and receive personalized diet, nutrition, sleep, and
            lifestyle recommendations.
          </p>

          <div className="publicHeroActions">
            <Link href="/register" className="primaryBtn">
              Get Started
            </Link>

            <Link href="/login" className="secondaryBtn">
              Login
            </Link>
          </div>
        </div>
      </section>

      <section className="publicSection">
        <div className="container">
          <div className="publicSectionHeader">
            <span className="pageBadge">Modules</span>
            <h2>What FitLife Can Do</h2>
            <p>
              These modules are available after login. Guest users can view this
              overview before creating an account.
            </p>
          </div>

          <div className="featureListGrid">
            {features.map((item) => (
              <div className="featureInfoCard" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="publicCta">
        <div className="container publicCtaBox">
          <div>
            <h2>Start your health journey with FitLife</h2>
            <p>
              Create an account to access the dashboard and all AI-powered
              health modules.
            </p>
          </div>

          <Link href="/register" className="primaryBtn">
            Create Account
          </Link>
        </div>
      </section>
    </main>
  );
}