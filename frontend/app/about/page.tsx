import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="publicPage">
      <section className="publicHero">
        <div className="container">
          <span className="pageBadge">About FitLife</span>

          <h1>AI-Powered Health and Fitness Assistant</h1>

          <p>
            FitLife is a web-based health and fitness assistant developed to
            help users understand their health status, track wellness progress,
            and receive personalized recommendations.
          </p>

          <div className="publicHeroActions">
            <Link href="/features" className="primaryBtn">
              View Features
            </Link>

            <Link href="/register" className="secondaryBtn">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="publicSection">
        <div className="container aboutGrid">
          <div className="aboutContentCard">
            <span className="pageBadge">Project Overview</span>

            <h2>What is FitLife?</h2>

            <p>
              FitLife is designed as a final-year software project using
              Next.js, TypeScript, FastAPI, Python, MongoDB, and machine
              learning. The system provides health-related modules such as BMI
              analysis, diet recommendation, fitness tracking, nutrition log,
              sleep tracking, mental wellness, and goal management.
            </p>

            <p>
              The main machine learning model predicts the user's health risk
              level as Low Risk, Medium Risk, or High Risk. Based on this
              prediction, the system provides rule-based diet, fitness, and
              lifestyle recommendations.
            </p>
          </div>

          <div className="aboutContentCard">
            <span className="pageBadge">Technology</span>

            <h2>System Technologies</h2>

            <ul className="aboutList">
              <li>Frontend: Next.js with TypeScript</li>
              <li>Backend: FastAPI with Python</li>
              <li>Database: MongoDB</li>
              <li>Machine Learning: Decision Tree Classifier</li>
              <li>Model Output: Low Risk, Medium Risk, High Risk</li>
              <li>Recommendation Method: Rule-based health guidance</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="publicSection publicLightSection">
        <div className="container">
          <div className="publicSectionHeader">
            <span className="pageBadge">Purpose</span>

            <h2>Why this system is useful</h2>

            <p>
              FitLife supports users by giving simple health insights and
              helping them make better lifestyle decisions. It is not a medical
              diagnosis system, but it provides educational health guidance
              based on user input and trained model predictions.
            </p>
          </div>

          <div className="aboutPurposeGrid">
            <div>
              <h3>For Users</h3>
              <p>
                Users can track BMI, health risk, diet, fitness, sleep, mood,
                nutrition, and goals in one place.
              </p>
            </div>

            <div>
              <h3>For Project Evaluation</h3>
              <p>
                The project demonstrates full-stack development, database
                integration, API creation, machine learning model training, and
                user-friendly interface design.
              </p>
            </div>

            <div>
              <h3>For Future Expansion</h3>
              <p>
                More datasets and AI models can be added later for advanced
                food recommendation, exercise prediction, and sleep risk
                analysis.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}