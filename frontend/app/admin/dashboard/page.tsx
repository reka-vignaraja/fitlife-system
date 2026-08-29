"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AdminStats = {
  registered_users: number;
  verified_users: number;
  health_predictions: number;
  progress_reports: number;
  diet_plans: number;
  fitness_plans: number;
  sleep_records: number;
  nutrition_logs: number;
  goals: number;
};

type AdminActivity = {
  id: string;
  title: string;
  description: string;
  type: string;
  icon: string;
  collection: string;
  date: string;
};

const defaultStats: AdminStats = {
  registered_users: 0,
  verified_users: 0,
  health_predictions: 0,
  progress_reports: 0,
  diet_plans: 0,
  fitness_plans: 0,
  sleep_records: 0,
  nutrition_logs: 0,
  goals: 0,
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats>(defaultStats);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState("");
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("fitlife_admin_token");

        if (!token) {
          router.replace("/admin/login");
          return;
        }

        const statsResponse = await fetch("http://localhost:8000/api/admin/stats", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const statsData = await statsResponse.json();

        if (!statsResponse.ok || !statsData.success) {
          throw new Error(statsData.detail || "Failed to load admin stats.");
        }

        setStats(statsData.stats || defaultStats);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading admin dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentActivity = async () => {
      try {
        const token = localStorage.getItem("fitlife_admin_token");

        if (!token) {
          router.replace("/admin/login");
          return;
        }

        const activityResponse = await fetch(
          "http://localhost:8000/api/admin/activity",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const activityData = await activityResponse.json();

        if (!activityResponse.ok || !activityData.success) {
          throw new Error(activityData.detail || "Failed to load recent activity.");
        }

        setActivities(activityData.activities || []);
      } catch (err) {
        setActivityError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading recent activity."
        );
      } finally {
        setActivityLoading(false);
      }
    };

    fetchDashboardData();
    fetchRecentActivity();
  }, [router]);

  const statCards = [
    {
      title: "Registered Users",
      value: stats.registered_users,
      description: "Total users registered in FitLife.",
      icon: "👥",
    },
    {
      title: "Verified Users",
      value: stats.verified_users,
      description: "Users who completed email verification.",
      icon: "✅",
    },
    {
      title: "Health Predictions",
      value: stats.health_predictions,
      description: "Generated health risk prediction records.",
      icon: "🩺",
    },
    {
      title: "Progress Reports",
      value: stats.progress_reports,
      description: "Saved user progress reports.",
      icon: "📄",
    },
    {
      title: "Diet Plans",
      value: stats.diet_plans,
      description: "Generated diet recommendation plans.",
      icon: "🥗",
    },
    {
      title: "Fitness Plans",
      value: stats.fitness_plans,
      description: "Generated fitness guider plans.",
      icon: "🏋️",
    },
    {
      title: "Sleep Records",
      value: stats.sleep_records,
      description: "Saved sleep tracking records.",
      icon: "😴",
    },
    {
      title: "Nutrition Logs",
      value: stats.nutrition_logs,
      description: "Saved daily nutrition log records.",
      icon: "🍎",
    },
  ];

  return (
    <main className="adminDashboardPage">
      <section className="adminHeroSection">
        <div>
          <span className="adminBadge">Backend Connected Monitoring Panel</span>

          <h1>Admin Dashboard</h1>

          <p>
            Monitor registered users, health predictions, diet plans, fitness
            plans, sleep records, nutrition logs, and generated progress reports
            using real MongoDB data.
          </p>
        </div>

        <div className="adminHeroCard">
          <strong>{stats.registered_users}</strong>
          <span>Total Registered Users</span>
        </div>
      </section>

      {loading && (
        <section className="adminTableCard">
          <div className="adminEmptyState">
            <h3>Loading dashboard...</h3>
            <p>Please wait while FitLife loads admin dashboard data.</p>
          </div>
        </section>
      )}

      {!loading && error && (
        <section className="adminTableCard">
          <div className="adminEmptyState">
            <h3>Unable to load dashboard</h3>
            <p>{error}</p>
          </div>
        </section>
      )}

      {!loading && !error && (
        <>
          <section className="adminStatsGrid">
            {statCards.map((card) => (
              <article key={card.title} className="adminStatCard">
                <div className="adminStatIcon">{card.icon}</div>
                <h3>{card.title}</h3>
                <strong>{card.value}</strong>
                <p>{card.description}</p>
              </article>
            ))}
          </section>

          <section className="adminMainGrid">
            <div className="adminPanel">
              <div className="adminPanelHeader">
                <div>
                  <span className="adminBadge">Management</span>
                  <h2>Admin Management</h2>
                  <p>Quick access to admin monitoring pages.</p>
                </div>
              </div>

              <div className="adminModuleGrid">
                <Link href="/admin/users" className="adminModuleLink">
                  <span>👥</span>
                  <div>
                    <strong>Users</strong>
                    <small>View registered users and profile information.</small>
                  </div>
                </Link>

                <Link href="/admin/reports" className="adminModuleLink">
                  <span>📄</span>
                  <div>
                    <strong>Reports</strong>
                    <small>View generated user progress reports.</small>
                  </div>
                </Link>

                <Link href="/admin/modules" className="adminModuleLink">
                  <span>🤖</span>
                  <div>
                    <strong>AI Modules</strong>
                    <small>Monitor module status and record counts.</small>
                  </div>
                </Link>
              </div>
            </div>

            <div className="adminActivityPanel">
              <div className="adminPanelHeader">
                <div>
                  <span className="adminBadge">Live Activity</span>
                  <h2>Recent Activity</h2>
                  <p>Latest records from FitLife system collections.</p>
                </div>
              </div>

              {activityLoading && (
                <div className="adminRecentEmpty">
                  <h3>Loading activity...</h3>
                  <p>Please wait while FitLife loads recent records.</p>
                </div>
              )}

              {!activityLoading && activityError && (
                <div className="adminRecentEmpty">
                  <h3>Unable to load activity</h3>
                  <p>{activityError}</p>
                </div>
              )}

              {!activityLoading && !activityError && activities.length === 0 && (
                <div className="adminRecentEmpty">
                  <h3>No recent activity found</h3>
                  <p>No records are available yet.</p>
                </div>
              )}

              {!activityLoading && !activityError && activities.length > 0 && (
                <div className="adminRecentList">
                  {activities.map((activity) => (
                    <article key={`${activity.collection}-${activity.id}`}>
                      <div className="adminRecentIcon">{activity.icon}</div>

                      <div className="adminRecentContent">
                        <div>
                          <h3>{activity.title}</h3>
                          <span>{activity.type}</span>
                        </div>

                        <p>{activity.description}</p>

                        <small>
                          {activity.collection} • {activity.date}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}