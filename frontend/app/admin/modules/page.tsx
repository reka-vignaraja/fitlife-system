"use client";

import { useEffect, useState } from "react";

type AdminModule = {
  id: string;
  name: string;
  category: string;
  status: string;
  records: number;
  collection: string;
  lastUpdated: string;
  description: string;
};

type ModuleSummary = {
  total_modules: number;
  active_modules: number;
  total_records: number;
};

export default function AdminModulesPage() {
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [summary, setSummary] = useState<ModuleSummary>({
    total_modules: 0,
    active_modules: 0,
    total_records: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const token = localStorage.getItem("fitlife_admin_token");

        if (!token) {
          setError("Admin token not found. Please login again.");
          setLoading(false);
          return;
        }

        const response = await fetch("http://localhost:8000/api/admin/modules", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.detail || "Failed to load module data.");
        }

        setModules(data.modules || []);
        setSummary(
          data.summary || {
            total_modules: 0,
            active_modules: 0,
            total_records: 0,
          }
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading modules."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  return (
    <main className="adminListPage">
      <section className="adminListTop">
        <div>
          <span className="adminBadge">AI Module Monitoring</span>
          <h1>Admin Module Status</h1>
          <p>
            Monitor FitLife AI, tracking, recommendation, and report generation
            modules using real MongoDB record counts.
          </p>
        </div>

        <div className="adminListStats">
          <div>
            <strong>{summary.total_modules}</strong>
            <span>Total Modules</span>
          </div>

          <div>
            <strong>{summary.active_modules}</strong>
            <span>Connected Modules</span>
          </div>

          <div>
            <strong>{summary.total_records}</strong>
            <span>Total Records</span>
          </div>
        </div>
      </section>

      {loading && (
        <section className="adminTableCard">
          <div className="adminEmptyState">
            <h3>Loading modules...</h3>
            <p>Please wait while FitLife loads admin module data.</p>
          </div>
        </section>
      )}

      {!loading && error && (
        <section className="adminTableCard">
          <div className="adminEmptyState">
            <h3>Unable to load modules</h3>
            <p>{error}</p>
          </div>
        </section>
      )}

      {!loading && !error && (
        <section className="adminModulesGrid">
          {modules.map((module) => (
            <article key={module.id} className="adminModuleCard">
              <div className="adminModuleCardTop">
                <div>
                  <span className="adminModuleCategory">{module.category}</span>
                  <h2>{module.name}</h2>
                </div>

                <span className="adminModuleStatus">{module.status}</span>
              </div>

              <p>{module.description}</p>

              <div className="adminModuleMetaGrid">
                <div>
                  <strong>{module.records}</strong>
                  <span>Records</span>
                </div>

                <div>
                  <strong>{module.lastUpdated}</strong>
                  <span>Last Updated</span>
                </div>
              </div>

              <div className="adminModuleCollection">
                Collection:
                <span>{module.collection}</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}